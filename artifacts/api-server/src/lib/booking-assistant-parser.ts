const EVENT_TYPES = [
  "diciottesimo",
  "laurea",
  "compleanno",
  "matrimonio",
  "aziendale",
] as const;

export type BookingConversationStep =
  | "nome"
  | "tipo_evento"
  | "data_evento"
  | "numero_invitati"
  | "completo"
  | "handoff";

export type BookingConversationSnapshot = {
  nome?: string | null;
  tipo_evento?: string | null;
  data_evento_richiesta?: string | null;
  numero_invitati?: number | null;
  handoff_richiesto?: boolean | null;
};

const MONTHS: Record<string, number> = {
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

export function renderTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isHandoffRequest(text: string): boolean {
  const normalized = normalizeText(text);
  return [
    "operatore",
    "persona",
    "umano",
    "staff",
    "responsabile",
    "salvatore",
    "chiamami",
    "mi chiamate",
    "posso parlare",
    "voglio parlare",
  ].some((pattern) => normalized.includes(pattern));
}

export function extractNome(text: string): string | undefined {
  const normalized = normalizeText(text);
  const match = normalized.match(/\b(?:mi chiamo|sono|io sono)\s+([a-z' ]{2,40})/i);
  if (!match) return undefined;
  const raw = match[1]
    .trim()
    .replace(/\s{2,}/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  return raw;
}

export function extractTipoEvento(text: string): string | undefined {
  const normalized = normalizeText(text);
  return EVENT_TYPES.find((type) => normalized.includes(type));
}

function parseNumericGuests(match: RegExpMatchArray | null): number | undefined {
  if (!match) return undefined;
  const value = Number.parseInt(match[1] ?? "", 10);
  if (Number.isNaN(value) || value <= 0) return undefined;
  return value;
}

export function extractNumeroInvitati(text: string): number | undefined {
  const normalized = normalizeText(text);
  return (
    parseNumericGuests(normalized.match(/\b(\d{1,4})\s*(?:invitati|persone|ospiti|ragazzi|ragazze)\b/i)) ??
    parseNumericGuests(normalized.match(/\bsiamo\s+(?:circa\s+)?(\d{1,4})\b/i)) ??
    parseNumericGuests(normalized.match(/\b(?:per|da)\s+(\d{1,4})\s+(?:persone|invitati|ospiti)\b/i)) ??
    extractApproximateGuestsInWords(normalized)
  );
}

function extractApproximateGuestsInWords(normalized: string): number | undefined {
  if (/\b(?:un\s+)?centinaio\b/.test(normalized)) return 100;
  if (/\b(?:una\s+)?cinquantina\b/.test(normalized)) return 50;
  if (/\b(?:una\s+)?trentina\b/.test(normalized)) return 30;
  if (/\b(?:una\s+)?ventina\b/.test(normalized)) return 20;
  if (/\b(?:una\s+)?decina\b/.test(normalized)) return 10;
  return undefined;
}

function toIsoDate(date: Date): string | undefined {
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractSlashDate(text: string): string | undefined {
  const match = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (!match) return undefined;
  const day = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10) - 1;
  let year = Number.parseInt(match[3] ?? "", 10);
  if (year < 100) year += 2000;
  return toIsoDate(new Date(year, month, day));
}

function extractMonthNameDate(text: string): string | undefined {
  const normalized = normalizeText(text);
  const match = normalized.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?\b/);
  if (!match) return undefined;
  const day = Number.parseInt(match[1] ?? "", 10);
  const month = MONTHS[match[2] ?? ""];
  const year = match[3] ? Number.parseInt(match[3], 10) : new Date().getFullYear();
  return toIsoDate(new Date(year, month, day));
}

function extractRelativeDate(text: string): string | undefined {
  const normalized = normalizeText(text);
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  if (normalized.includes("dopodomani")) {
    base.setDate(base.getDate() + 2);
    return toIsoDate(base);
  }
  if (normalized.includes("domani")) {
    base.setDate(base.getDate() + 1);
    return toIsoDate(base);
  }
  return undefined;
}

export function extractDataEvento(text: string): string | undefined {
  return extractSlashDate(text) ?? extractMonthNameDate(text) ?? extractRelativeDate(text);
}

export function formatDateForReply(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function getMissingBookingSteps(snapshot: BookingConversationSnapshot): BookingConversationStep[] {
  if (snapshot.handoff_richiesto) {
    return ["handoff"];
  }

  const missing: BookingConversationStep[] = [];
  if (!snapshot.nome || snapshot.nome === "Sconosciuto") missing.push("nome");
  if (!snapshot.tipo_evento) missing.push("tipo_evento");
  if (!snapshot.data_evento_richiesta) missing.push("data_evento");
  if (!snapshot.numero_invitati) missing.push("numero_invitati");
  return missing;
}

export function getCurrentBookingStep(snapshot: BookingConversationSnapshot): BookingConversationStep {
  const [nextStep] = getMissingBookingSteps(snapshot);
  return nextStep ?? "completo";
}
