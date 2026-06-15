const monthMap: Record<string, number> = {
  GENNAIO: 1,
  FEBBRAIO: 2,
  MARZO: 3,
  APRILE: 4,
  MAGGIO: 5,
  GIUGNO: 6,
  LUGLIO: 7,
  AGOSTO: 8,
  SETTEMBRE: 9,
  OTTOBRE: 10,
  NOVEMBRE: 11,
  DICEMBRE: 12,
};

const monthLabels = Object.fromEntries(Object.entries(monthMap).map(([label, month]) => [month, label.toLowerCase()]));

type DepositStatus = "si" | "no" | "sconosciuto";

export type NumbersAgendaImportConfig = {
  year: number;
  defaultMonth?: number;
  category: string;
  pSlotLabel: string;
  pStartTime: string;
  pEndTime: string;
  cSlotLabel: string;
  cStartTime: string;
  cEndTime: string;
};

export type ParsedNumbersAgendaItem = {
  riga: number;
  giorno: number;
  mese: number;
  mese_label: string;
  slot: string;
  titolo: string;
  data: string;
  data_ora_inizio: string;
  data_ora_fine: string;
  acconto_stato: DepositStatus;
  gia_presente: boolean;
  raw_text: string;
};

type ParsedNumbersAgendaResult = {
  totalRows: number;
  items: ParsedNumbersAgendaItem[];
  errors: Array<{ riga: number; motivo: string }>;
};

function normalizeCell(value: string) {
  return value.replace(/\u00a0/g, " ").trim();
}

function detectDelimiter(lines: string[]) {
  const sample = lines.find((line) => line.trim()) ?? "";
  const candidates: Array<"," | ";" | "\t"> = [",", ";", "\t"];
  return candidates
    .map((delimiter) => ({ delimiter, count: sample.split(delimiter).length }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter ?? ",";
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && next === "\"") {
      current += "\"";
      index++;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(normalizeCell(current));
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(normalizeCell(current));
  return cells;
}

function parseMonthLabel(cells: string[]) {
  for (const cell of cells) {
    const normalized = normalizeCell(cell).toUpperCase();
    if (monthMap[normalized]) {
      return monthMap[normalized];
    }
  }
  return null;
}

function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Orario non valido: ${value}`);
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Orario non valido: ${value}`);
  }
  return { hour, minute };
}

function offsetForRome(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Rome",
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+1";
  const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "+01:00";
  return `${match[1]}${String(match[2]).padStart(2, "0")}:${String(match[3] ?? "00").padStart(2, "0")}`;
}

function buildIsoInRome(year: number, month: number, day: number, time: string) {
  const { hour, minute } = parseTime(time);
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offsetForRome(date)}`;
}

function buildDepositStatus(cells: string[], siIndex: number | null, noIndex: number | null): DepositStatus {
  const isMarked = (index: number | null) => index !== null && normalizeCell(cells[index] ?? "").toUpperCase() === "X";
  if (isMarked(siIndex)) return "si";
  if (isMarked(noIndex)) return "no";
  return "sconosciuto";
}

function findSlotIndex(cells: string[], labels: string[]) {
  return cells.findIndex((cell) => labels.includes(normalizeCell(cell).toUpperCase()));
}

function extractDescription(cells: string[], slotIndex: number, siIndex: number | null, noIndex: number | null) {
  const reserved = new Set([slotIndex, siIndex ?? -1, noIndex ?? -1]);
  for (let index = slotIndex + 1; index < cells.length; index++) {
    if (reserved.has(index)) continue;
    const value = normalizeCell(cells[index] ?? "");
    if (!value) continue;
    if (/^(X|SI|NO|ACCONTO)$/i.test(value)) continue;
    return value;
  }
  return "";
}

export function buildParsedNumbersAgendaKey(item: Pick<ParsedNumbersAgendaItem, "data_ora_inizio" | "titolo" | "slot">) {
  return `${item.data_ora_inizio}|${item.slot.toLowerCase()}|${item.titolo.trim().toLowerCase()}`;
}

export function buildNumbersAgendaExistingKey(input: { data_ora_inizio: string; titolo: string; descrizione?: string | null }) {
  const slotMatch = (input.descrizione ?? "").match(/Slot: ([A-Z])/);
  return `${input.data_ora_inizio}|${(slotMatch?.[1] ?? "").toLowerCase()}|${input.titolo.trim().toLowerCase()}`;
}

export function parseNumbersAgendaCsv(csv: string, config: NumbersAgendaImportConfig): ParsedNumbersAgendaResult {
  const lines = csv.split(/\r?\n/).map((line) => line.replace(/\r/g, ""));
  const nonEmptyLines = lines.filter((line) => line.trim());
  const delimiter = detectDelimiter(nonEmptyLines);
  const rows = lines.map((line) => parseCsvLine(line, delimiter));
  const slotLabels = [config.pSlotLabel.toUpperCase(), config.cSlotLabel.toUpperCase()];

  let currentMonth = config.defaultMonth ?? null;
  let currentDay: number | null = null;
  let siIndex: number | null = null;
  let noIndex: number | null = null;

  const items: ParsedNumbersAgendaItem[] = [];
  const errors: Array<{ riga: number; motivo: string }> = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cells = rows[rowIndex];
    const monthFromRow = parseMonthLabel(cells);
    if (monthFromRow) {
      currentMonth = monthFromRow;
    }

    const yesHeaderIndex = cells.findIndex((cell) => normalizeCell(cell).toUpperCase() === "SI");
    const noHeaderIndex = cells.findIndex((cell) => normalizeCell(cell).toUpperCase() === "NO");
    if (yesHeaderIndex >= 0) siIndex = yesHeaderIndex;
    if (noHeaderIndex >= 0) noIndex = noHeaderIndex;

    const dayCell = cells.find((cell) => /^\d{1,2}$/.test(normalizeCell(cell)));
    if (dayCell) {
      currentDay = Number(dayCell);
    }

    const slotIndex = findSlotIndex(cells, slotLabels);
    if (slotIndex < 0) {
      continue;
    }

    const slot = normalizeCell(cells[slotIndex] ?? "").toUpperCase();
    const title = extractDescription(cells, slotIndex, siIndex, noIndex);
    if (!title) {
      continue;
    }

    if (!currentMonth || !currentDay) {
      errors.push({ riga: rowIndex + 1, motivo: "Mese o giorno non riconosciuto per la riga evento" });
      continue;
    }

    const startTime = slot === config.pSlotLabel.toUpperCase() ? config.pStartTime : config.cStartTime;
    const endTime = slot === config.pSlotLabel.toUpperCase() ? config.pEndTime : config.cEndTime;
    const date = `${config.year}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

    items.push({
      riga: rowIndex + 1,
      giorno: currentDay,
      mese: currentMonth,
      mese_label: monthLabels[currentMonth] ?? String(currentMonth),
      slot,
      titolo: title,
      data: date,
      data_ora_inizio: buildIsoInRome(config.year, currentMonth, currentDay, startTime),
      data_ora_fine: buildIsoInRome(config.year, currentMonth, currentDay, endTime),
      acconto_stato: buildDepositStatus(cells, siIndex, noIndex),
      gia_presente: false,
      raw_text: title,
    });
  }

  return {
    totalRows: nonEmptyLines.length,
    items,
    errors,
  };
}

export function annotateExistingAgendaItems(
  items: ParsedNumbersAgendaItem[],
  existingKeys: Set<string>,
) {
  const seenKeys = new Set(existingKeys);
  return items.map((item) => {
    const key = buildParsedNumbersAgendaKey(item);
    const duplicate = seenKeys.has(key);
    seenKeys.add(key);
    return {
      ...item,
      gia_presente: duplicate,
    };
  });
}

export function buildNumbersAgendaDescription(item: ParsedNumbersAgendaItem) {
  return [
    "Importato da Apple Numbers",
    `Slot: ${item.slot}`,
    `Acconto: ${item.acconto_stato}`,
    `Data sorgente: ${item.data}`,
    `Titolo originale: ${item.raw_text}`,
  ].join("\n");
}
