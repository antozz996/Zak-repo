import { and, desc, eq } from "drizzle-orm";
import {
  contattiCrmTable,
  db,
  messaggiTable,
  preventiviEventiTable,
  type Contatto,
  type Preventivo,
} from "@workspace/db";
import { sendWhatsAppTextSafely } from "./whatsapp";

const EVENT_TYPES = [
  "diciottesimo",
  "laurea",
  "compleanno",
  "matrimonio",
  "aziendale",
] as const;

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

type BookingAssistantResult = {
  contatto: Contatto;
  preventivo: Preventivo | null;
  risposta: string | null;
  datiEstratti: {
    nome?: string;
    tipo_evento?: string;
    data_evento_richiesta?: string;
    numero_invitati?: number;
  };
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractNome(text: string): string | undefined {
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

function extractTipoEvento(text: string): string | undefined {
  const normalized = normalizeText(text);
  return EVENT_TYPES.find((type) => normalized.includes(type));
}

function parseNumericGuests(match: RegExpMatchArray | null): number | undefined {
  if (!match) return undefined;
  const value = Number.parseInt(match[1] ?? "", 10);
  if (Number.isNaN(value) || value <= 0) return undefined;
  return value;
}

function extractNumeroInvitati(text: string): number | undefined {
  return (
    parseNumericGuests(text.match(/\b(\d{1,4})\s*(?:invitati|persone|ospiti|ragazzi|ragazze)\b/i)) ??
    parseNumericGuests(text.match(/\bsiamo\s+(?:circa\s+)?(\d{1,4})\b/i)) ??
    parseNumericGuests(text.match(/\b(?:per|da)\s+(\d{1,4})\s+(?:persone|invitati|ospiti)\b/i))
  );
}

function toIsoDate(date: Date): string | undefined {
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().split("T")[0];
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

function extractDataEvento(text: string): string | undefined {
  return extractSlashDate(text) ?? extractMonthNameDate(text) ?? extractRelativeDate(text);
}

async function getOrCreateOpenPreventivo(contattoId: string): Promise<Preventivo> {
  const [existing] = await db
    .select()
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.contatto_id, contattoId), eq(preventiviEventiTable.stato_evento, "opzionato")))
    .orderBy(desc(preventiviEventiTable.data_creazione))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(preventiviEventiTable)
    .values({
      contatto_id: contattoId,
      stato_evento: "opzionato",
      note: "Creato automaticamente dal booking assistant",
    })
    .returning();

  return created;
}

async function checkAvailability(dataEvento: string): Promise<{ disponibile: boolean; alternative: string[] }> {
  const [existing] = await db
    .select()
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.data_evento_richiesta, dataEvento), eq(preventiviEventiTable.stato_evento, "confermato")));

  if (!existing) {
    return { disponibile: true, alternative: [] };
  }

  const alternative: string[] = [];
  const baseDate = new Date(dataEvento);
  let checked = 0;
  let offset = 1;

  while (alternative.length < 3 && checked < 90) {
    const candidate = new Date(baseDate);
    candidate.setDate(candidate.getDate() + offset);
    const day = candidate.getDay();
    if (day === 5 || day === 0) {
      const candidateStr = candidate.toISOString().split("T")[0];
      const [conflict] = await db
        .select()
        .from(preventiviEventiTable)
        .where(and(eq(preventiviEventiTable.data_evento_richiesta, candidateStr), eq(preventiviEventiTable.stato_evento, "confermato")));
      if (!conflict) alternative.push(candidateStr);
    }
    offset++;
    checked++;
  }

  return { disponibile: false, alternative };
}

function formatDateForReply(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function buildNextQuestion(contatto: Contatto, preventivo: Preventivo): string {
  if (!contatto.nome || contatto.nome === "Sconosciuto") {
    return "Ciao! Sono Zak AI. Per iniziare, come ti chiami?";
  }

  if (!contatto.tipo_evento) {
    return `Piacere ${contatto.nome}! Che tipo di evento vuoi organizzare? Ad esempio compleanno, laurea, diciottesimo, matrimonio o aziendale.`;
  }

  if (!preventivo.data_evento_richiesta) {
    return `Perfetto ${contatto.nome}. Che data hai in mente per il tuo ${contatto.tipo_evento}? Puoi scriverla anche come 14/09/2026.`;
  }

  if (!preventivo.numero_invitati) {
    return "Ottimo. Quanti invitati prevedi circa?";
  }

  return `Perfetto ${contatto.nome}, ho raccolto tutte le informazioni principali per il tuo ${contatto.tipo_evento} del ${formatDateForReply(preventivo.data_evento_richiesta)} per circa ${preventivo.numero_invitati} invitati. Ti ricontatteremo presto con i dettagli.`;
}

async function saveAssistantMessage(contatto: Contatto, testo: string) {
  await db.insert(messaggiTable).values({
    contatto_id: contatto.id,
    canale: "whatsapp",
    direzione: "outbound",
    testo,
    mittente_nome: "Zak AI",
  });

  await sendWhatsAppTextSafely({
    to: contatto.telefono,
    text: testo,
  });
}

export async function processBookingAssistantMessage(input: {
  contatto: Contatto;
  testo: string;
}): Promise<BookingAssistantResult> {
  const datiEstratti: BookingAssistantResult["datiEstratti"] = {};

  const nome = extractNome(input.testo);
  const tipoEvento = extractTipoEvento(input.testo);
  const dataEvento = extractDataEvento(input.testo);
  const numeroInvitati = extractNumeroInvitati(input.testo);

  if (nome) datiEstratti.nome = nome;
  if (tipoEvento) datiEstratti.tipo_evento = tipoEvento;
  if (dataEvento) datiEstratti.data_evento_richiesta = dataEvento;
  if (numeroInvitati) datiEstratti.numero_invitati = numeroInvitati;

  const contattoUpdate: Partial<Contatto> = {
    ultimo_contatto: new Date(),
  };

  if ((!input.contatto.nome || input.contatto.nome === "Sconosciuto") && nome) {
    contattoUpdate.nome = nome;
  }
  if (!input.contatto.tipo_evento && tipoEvento) {
    contattoUpdate.tipo_evento = tipoEvento;
  }
  if (nome || tipoEvento || dataEvento || numeroInvitati) {
    contattoUpdate.stato_lead = "in_trattativa";
  }

  let contatto = input.contatto;
  if (Object.keys(contattoUpdate).length > 0) {
    const [updated] = await db
      .update(contattiCrmTable)
      .set(contattoUpdate)
      .where(eq(contattiCrmTable.id, input.contatto.id))
      .returning();
    if (updated) contatto = updated;
  }

  let preventivo = await getOrCreateOpenPreventivo(contatto.id);
  const preventivoUpdate: Partial<Preventivo> = {};

  if (!preventivo.data_evento_richiesta && dataEvento) {
    preventivoUpdate.data_evento_richiesta = dataEvento;
  }
  if (!preventivo.numero_invitati && numeroInvitati) {
    preventivoUpdate.numero_invitati = numeroInvitati;
  }

  const noteParts = [
    preventivo.note,
    nome ? `Nome rilevato in chat: ${nome}` : null,
    tipoEvento ? `Tipo evento rilevato: ${tipoEvento}` : null,
  ].filter(Boolean);

  if (noteParts.length > 0) {
    preventivoUpdate.note = Array.from(new Set(noteParts)).join("\n");
  }

  if (Object.keys(preventivoUpdate).length > 0) {
    const [updatedPreventivo] = await db
      .update(preventiviEventiTable)
      .set(preventivoUpdate)
      .where(eq(preventiviEventiTable.id, preventivo.id))
      .returning();
    if (updatedPreventivo) preventivo = updatedPreventivo;
  }

  let risposta = buildNextQuestion(contatto, preventivo);

  if (dataEvento && preventivo.data_evento_richiesta === dataEvento) {
    const availability = await checkAvailability(dataEvento);
    if (!availability.disponibile) {
      const alternativeText = availability.alternative.length > 0
        ? ` Ti posso proporre queste alternative: ${availability.alternative.map(formatDateForReply).join(", ")}.`
        : "";
      risposta = `La data ${formatDateForReply(dataEvento)} risulta gia occupata.${alternativeText} Dimmi quale preferisci oppure scrivimi un'altra data.`;
      await db
        .update(preventiviEventiTable)
        .set({ data_evento_richiesta: null })
        .where(eq(preventiviEventiTable.id, preventivo.id));
      preventivo = { ...preventivo, data_evento_richiesta: null };
    } else if (!preventivo.numero_invitati) {
      risposta = `Ottimo, il ${formatDateForReply(dataEvento)} risulta disponibile. Quanti invitati prevedi circa?`;
    }
  }

  if (risposta) {
    await saveAssistantMessage(contatto, risposta);
  }

  return {
    contatto,
    preventivo,
    risposta,
    datiEstratti,
  };
}
