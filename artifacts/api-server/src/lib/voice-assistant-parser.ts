export type VoiceIntent = {
  type: "task" | "agenda";
  confidence: "alta" | "media" | "bassa";
  dateTime: {
    date: Date | null;
    explicit: boolean;
  };
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isTaskIntent(text: string) {
  const normalized = normalizeText(text);
  return ["ricordami", "promemoria", "task", "da fare", "todo", "segnati", "appuntati"].some((pattern) => normalized.includes(pattern));
}

function isAgendaIntent(text: string) {
  const normalized = normalizeText(text);
  return [
    "appuntamento",
    "riunione",
    "incontro",
    "fissa",
    "prenota",
    "agenda",
    "calendario",
    "sopralluogo",
    "visita",
    "ci vediamo",
    "firmare",
    "firma",
    "contratto",
    "rimandare",
  ].some((pattern) => normalized.includes(pattern));
}

export function extractVoicePriority(text: string) {
  const normalized = normalizeText(text);
  if (["urgentissimo", "urgente", "subito", "immediato"].some((pattern) => normalized.includes(pattern))) return "urgente";
  if (["importante", "priorita alta", "alta priorita"].some((pattern) => normalized.includes(pattern))) return "alta";
  if (["quando puoi", "senza fretta", "bassa priorita"].some((pattern) => normalized.includes(pattern))) return "bassa";
  return "media";
}

export function buildTaskTitle(text: string) {
  const cleaned = text
    .replace(/^(ricordami di|ricordami|promemoria|task|da fare|todo|segnati di|segnati|appuntati di|appuntati)[:\s-]*/i, "")
    .trim();
  return (cleaned || text).slice(0, 120);
}

export function buildAgendaTitle(text: string, contatto?: { nome: string } | null) {
  const cleaned = text
    .replace(/^(fissa|prenota|metti in agenda|aggiungi in agenda|appuntamento|riunione|incontro|sopralluogo)[:\s-]*/i, "")
    .trim();
  const subject = (cleaned || text).slice(0, 90);
  return contatto ? `${subject} - ${contatto.nome}` : subject;
}

function parseVoiceTime(text: string) {
  const normalized = normalizeText(text);
  const match = normalized.match(/\b(?:alle|ore)\s+(\d{1,2})(?::|\.| e )?(\d{2})?\b/);
  if (!match) return { hours: 9, minutes: 0, explicit: false };
  const hours = Math.min(Math.max(Number.parseInt(match[1] ?? "9", 10), 0), 23);
  const minutes = Math.min(Math.max(Number.parseInt(match[2] ?? "0", 10), 0), 59);
  return { hours, minutes, explicit: true };
}

function parseWeekdayDate(normalized: string) {
  const weekdays: Record<string, number> = {
    domenica: 0,
    lunedi: 1,
    martedi: 2,
    mercoledi: 3,
    giovedi: 4,
    venerdi: 5,
    sabato: 6,
  };
  const match = normalized.match(/\b(lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)(?:\s+prossimo)?\b/);
  if (!match) return null;

  const targetDay = weekdays[match[1] ?? ""];
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  const currentDay = base.getDay();
  const daysUntil = ((targetDay - currentDay + 7) % 7) || 7;
  base.setDate(base.getDate() + daysUntil);
  return base;
}

function parseVoiceDate(text: string) {
  const normalized = normalizeText(text);
  const base = new Date();
  base.setHours(9, 0, 0, 0);

  if (normalized.includes("dopodomani")) {
    base.setDate(base.getDate() + 2);
    return { date: base, explicit: true };
  }
  if (normalized.includes("domani")) {
    base.setDate(base.getDate() + 1);
    return { date: base, explicit: true };
  }
  if (normalized.includes("oggi")) {
    return { date: base, explicit: true };
  }

  const slashMatch = normalized.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if (slashMatch) {
    const day = Number.parseInt(slashMatch[1] ?? "", 10);
    const month = Number.parseInt(slashMatch[2] ?? "", 10) - 1;
    let year = slashMatch[3] ? Number.parseInt(slashMatch[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000;
    return { date: new Date(year, month, day, 9, 0, 0, 0), explicit: true };
  }

  const months: Record<string, number> = {
    gennaio: 0,
    febbraio: 1,
    marzo: 2,
    aprile: 3,
    maggio: 4,
    giugno: 5,
    luglio: 6,
    agosto: 7,
    settembre: 8,
    ottobre: 9,
    novembre: 10,
    dicembre: 11,
  };
  const monthMatch = normalized.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?\b/);
  if (monthMatch) {
    const day = Number.parseInt(monthMatch[1] ?? "", 10);
    const month = months[monthMatch[2] ?? ""];
    const year = monthMatch[3] ? Number.parseInt(monthMatch[3], 10) : new Date().getFullYear();
    return { date: new Date(year, month, day, 9, 0, 0, 0), explicit: true };
  }

  const weekdayDate = parseWeekdayDate(normalized);
  if (weekdayDate) {
    return { date: weekdayDate, explicit: true };
  }

  return { date: null, explicit: false };
}

export function parseVoiceDateTime(text: string) {
  const parsedDate = parseVoiceDate(text);
  if (!parsedDate.date) return { date: null, explicit: false };

  const parsedTime = parseVoiceTime(text);
  parsedDate.date.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
  return { date: parsedDate.date, explicit: parsedDate.explicit || parsedTime.explicit };
}

export function parseVoiceIntent(text: string): VoiceIntent {
  const normalized = normalizeText(text);
  const isTask = isTaskIntent(text);
  const isAgenda = isAgendaIntent(text);
  const dateTime = parseVoiceDateTime(text);

  if (isTask && !isAgenda) {
    return { type: "task", confidence: "alta", dateTime };
  }

  if (isAgenda) {
    return { type: "agenda", confidence: dateTime.explicit ? "alta" : "media", dateTime };
  }

  if (["richiam", "controll", "verific", "prepar", "mandare", "inviare", "contatt"].some((pattern) => normalized.includes(pattern))) {
    return { type: "task", confidence: "media", dateTime };
  }

  return { type: "agenda", confidence: "bassa", dateTime };
}
