import crypto from "node:crypto";
import {
  agendaPersonaleTable,
  contattiCrmTable,
  db,
  messaggiTable,
  preventiviEventiTable,
} from "@workspace/db";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { publishChatEvent } from "./chat-events";
import { syncAgendaItemToGoogle } from "./google-calendar";

export function generatePublicQuoteToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function getPublicAppBaseUrl() {
  return (
    process.env.ZAK_PUBLIC_APP_URL
    ?? process.env.RENDER_EXTERNAL_URL
    ?? "https://zak-ecosystem-ai.onrender.com"
  ).replace(/\/$/, "");
}

export function buildPublicQuoteUrl(token: string) {
  return `${getPublicAppBaseUrl()}/condividi/${token}`;
}

export async function createSystemMessage(input: {
  contattoId: string;
  testo: string;
  canale?: string;
}) {
  const [row] = await db.insert(messaggiTable).values({
    contatto_id: input.contattoId,
    canale: input.canale ?? "interno",
    direzione: "outbound",
    testo: input.testo,
    mittente_nome: "Sistema Zak",
  }).returning();

  publishChatEvent("message_created", {
    messaggio_id: row.id,
    contatto_id: row.contatto_id,
    canale: row.canale,
    direzione: row.direzione,
  });

  await db
    .update(contattiCrmTable)
    .set({ ultimo_contatto: new Date() })
    .where(eq(contattiCrmTable.id, input.contattoId));

  return row;
}

function buildAgendaWindow(dateValue: string) {
  const start = new Date(`${dateValue}T20:00:00`);
  const end = new Date(`${dateValue}T23:59:00`);
  return { start, end };
}

export async function syncLinkedAgendaForPreventivo(input: {
  preventivoId: string;
  contattoId: string;
  contattoNome?: string | null;
  dataEvento?: string | null;
}) {
  if (!input.dataEvento) {
    return null;
  }

  const { start, end } = buildAgendaWindow(input.dataEvento);
  const titolo = input.contattoNome ? `Evento ${input.contattoNome}` : `Evento preventivo ${input.preventivoId}`;
  const marker = `Preventivo ID: ${input.preventivoId}`;

  const [existing] = await db
    .select()
    .from(agendaPersonaleTable)
    .where(
      and(
        eq(agendaPersonaleTable.contatto_id, input.contattoId),
        ilike(sql`coalesce(${agendaPersonaleTable.descrizione}, '')`, `%${marker}%`),
      ),
    )
    .orderBy(desc(agendaPersonaleTable.data_ora_inizio))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(agendaPersonaleTable)
      .set({
        titolo,
        descrizione: [existing.descrizione, marker].filter(Boolean).join("\n"),
        data_ora_inizio: start,
        data_ora_fine: end,
        promemoria_inviato: false,
      })
      .where(eq(agendaPersonaleTable.id, existing.id))
      .returning();
    await syncAgendaItemToGoogle(updated);
    return updated;
  }

  const [fallback] = await db
    .select()
    .from(agendaPersonaleTable)
    .where(eq(agendaPersonaleTable.contatto_id, input.contattoId))
    .orderBy(desc(agendaPersonaleTable.data_ora_inizio))
    .limit(1);

  if (fallback) {
    const [updated] = await db
      .update(agendaPersonaleTable)
      .set({
        titolo,
        descrizione: [fallback.descrizione, marker].filter(Boolean).join("\n"),
        data_ora_inizio: start,
        data_ora_fine: end,
        promemoria_inviato: false,
      })
      .where(eq(agendaPersonaleTable.id, fallback.id))
      .returning();
    await syncAgendaItemToGoogle(updated);
    return updated;
  }

  const [created] = await db.insert(agendaPersonaleTable).values({
    titolo,
    descrizione: marker,
    data_ora_inizio: start,
    data_ora_fine: end,
    categoria: "lavoro",
    contatto_id: input.contattoId,
  }).returning();
  await syncAgendaItemToGoogle(created);
  return created;
}

export async function syncPreventivoFromImportedAgenda(input: {
  titolo: string;
  dataEvento: string;
}) {
  const normalizedTitle = input.titolo.trim().toLowerCase();
  if (!normalizedTitle) {
    return null;
  }

  const candidates = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
    })
    .from(preventiviEventiTable)
    .innerJoin(contattiCrmTable, eq(contattiCrmTable.id, preventiviEventiTable.contatto_id))
    .where(eq(preventiviEventiTable.data_evento_richiesta, input.dataEvento));

  const matches = candidates.filter((candidate) => {
    const contactName = candidate.contatto_nome?.trim().toLowerCase();
    return Boolean(contactName && normalizedTitle.includes(contactName));
  });

  if (matches.length !== 1) {
    return null;
  }

  const [updated] = await db
    .update(preventiviEventiTable)
    .set({ data_evento_richiesta: input.dataEvento })
    .where(eq(preventiviEventiTable.id, matches[0]!.id))
    .returning();

  return updated ?? null;
}
