import { Router } from "express";
import { db, contattiCrmTable, preventiviEventiTable, messaggiTable, agendaPersonaleTable } from "@workspace/db";
import { eq, count, sql, and, gte, lt, lte, desc, type SQL } from "drizzle-orm";
import {
  calendarSlots,
  checkGoogleCalendarAvailability,
  type CalendarSlot,
} from "../lib/google-calendar";

const router = Router();

function isCalendarSlot(value: string | undefined): value is CalendarSlot {
  return Boolean(value && (calendarSlots as readonly string[]).includes(value));
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateRange(query: { data_da?: string; data_a?: string }) {
  const dataDa = query.data_da ? new Date(`${query.data_da}T00:00:00`) : undefined;
  const dataA = query.data_a ? new Date(`${query.data_a}T00:00:00`) : undefined;

  if (dataA) {
    dataA.setDate(dataA.getDate() + 1);
  }

  return {
    dataDa,
    dataAExclusive: dataA,
    dataDaString: query.data_da,
    dataAString: query.data_a,
  };
}

function buildTimestampConditions(column: any, dataDa?: Date, dataAExclusive?: Date): SQL[] {
  const conditions: SQL[] = [];
  if (dataDa) conditions.push(gte(column, dataDa));
  if (dataAExclusive) conditions.push(lt(column, dataAExclusive));
  return conditions;
}

function buildDateConditions(column: any, dataDa?: string, dataA?: string): SQL[] {
  const conditions: SQL[] = [];
  if (dataDa) conditions.push(gte(column, dataDa));
  if (dataA) conditions.push(lte(column, dataA));
  return conditions;
}

router.get("/dashboard/stats", async (req, res) => {
  const range = parseDateRange(req.query as { data_da?: string; data_a?: string });
  const today = range.dataDa ?? new Date();
  today.setHours(0, 0, 0, 0);

  const contattiRangeConditions = buildTimestampConditions(contattiCrmTable.data_creazione, range.dataDa, range.dataAExclusive);
  const preventiviRangeConditions = buildTimestampConditions(preventiviEventiTable.data_creazione, range.dataDa, range.dataAExclusive);
  const messaggiRangeConditions = buildTimestampConditions(messaggiTable.timestamp, range.dataDa, range.dataAExclusive);

  const [totaleContatti] = await db
    .select({ count: count() })
    .from(contattiCrmTable)
    .where(contattiRangeConditions.length > 0 ? and(...contattiRangeConditions) : undefined);

  const nuoviOggiConditions = [gte(contattiCrmTable.data_creazione, today)] as SQL[];
  if (range.dataAExclusive) {
    nuoviOggiConditions.push(lt(contattiCrmTable.data_creazione, range.dataAExclusive));
  }

  const [nuoviOggi] = await db
    .select({ count: count() })
    .from(contattiCrmTable)
    .where(and(...nuoviOggiConditions));

  const [preventiviAttivi] = await db
    .select({ count: count() })
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.stato_evento, "opzionato"), ...preventiviRangeConditions));

  const [eventiConfermati] = await db
    .select({ count: count() })
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.stato_evento, "confermato"), ...preventiviRangeConditions));

  const [budgetResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${preventiviEventiTable.budget_stimato}::numeric), 0)`,
    })
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.stato_evento, "confermato"), ...preventiviRangeConditions));

  const [messaggiNonLetti] = await db
    .select({ count: count() })
    .from(messaggiTable)
    .where(and(eq(messaggiTable.letto, false), eq(messaggiTable.direzione, "inbound"), ...messaggiRangeConditions));

  const [leadConPreventivo] = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${preventiviEventiTable.contatto_id})::int`,
    })
    .from(preventiviEventiTable)
    .where(preventiviRangeConditions.length > 0 ? and(...preventiviRangeConditions) : undefined);

  const [leadConfermati] = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${preventiviEventiTable.contatto_id})::int`,
    })
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.stato_evento, "confermato"), ...preventiviRangeConditions));

  const totaleLead = Number(totaleContatti.count);
  const totaleLeadConPreventivo = Number(leadConPreventivo?.count ?? 0);
  const totaleLeadConfermati = Number(leadConfermati?.count ?? 0);

  const conversioneLeadPreventivo = totaleLead > 0 ? (totaleLeadConPreventivo / totaleLead) * 100 : 0;
  const conversionePreventivoConfermato = totaleLeadConPreventivo > 0 ? (totaleLeadConfermati / totaleLeadConPreventivo) * 100 : 0;
  const conversioneLeadConfermato = totaleLead > 0 ? (totaleLeadConfermati / totaleLead) * 100 : 0;

  res.json({
    totale_contatti: totaleContatti.count,
    nuovi_oggi: nuoviOggi.count,
    preventivi_attivi: preventiviAttivi.count,
    eventi_confermati: eventiConfermati.count,
    budget_totale_confermato: Number(budgetResult?.total ?? 0),
    messaggi_non_letti: messaggiNonLetti.count,
    lead_con_preventivo: totaleLeadConPreventivo,
    lead_confermati: totaleLeadConfermati,
    conversione_lead_preventivo: Number(conversioneLeadPreventivo.toFixed(1)),
    conversione_preventivo_confermato: Number(conversionePreventivoConfermato.toFixed(1)),
    conversione_lead_confermato: Number(conversioneLeadConfermato.toFixed(1)),
  });
});

router.get("/dashboard/lead-pipeline", async (req, res) => {
  const range = parseDateRange(req.query as { data_da?: string; data_a?: string });
  const conditions = buildTimestampConditions(contattiCrmTable.data_creazione, range.dataDa, range.dataAExclusive);

  const result = await db
    .select({
      stato: contattiCrmTable.stato_lead,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(contattiCrmTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(contattiCrmTable.stato_lead)
    .orderBy(desc(sql`COUNT(*)`));

  res.json(result);
});

router.get("/dashboard/eventi-mese", async (req, res) => {
  const range = parseDateRange(req.query as { data_da?: string; data_a?: string });
  const eventDateConditions = buildDateConditions(preventiviEventiTable.data_evento_richiesta, range.dataDaString, range.dataAString);
  const defaultYearCondition = !range.dataDaString && !range.dataAString
    ? sql`AND EXTRACT(YEAR FROM ${preventiviEventiTable.data_evento_richiesta}::date) = EXTRACT(YEAR FROM NOW())`
    : sql``;

  const result = await db.execute(sql`
    SELECT TO_CHAR(${preventiviEventiTable.data_evento_richiesta}::date, 'Mon') as mese,
           EXTRACT(MONTH FROM ${preventiviEventiTable.data_evento_richiesta}::date)::int as mese_num,
           COUNT(*)::int as count
    FROM preventivi_eventi
    WHERE ${preventiviEventiTable.stato_evento} = 'confermato'
      AND ${preventiviEventiTable.data_evento_richiesta} IS NOT NULL
      ${eventDateConditions.length > 0 ? sql`AND ${and(...eventDateConditions)}` : sql``}
      ${defaultYearCondition}
    GROUP BY mese, mese_num
    ORDER BY mese_num
  `);
  res.json(result.rows);
});

router.get("/dashboard/attivita-recente", async (req, res) => {
  const range = parseDateRange(req.query as { data_da?: string; data_a?: string });
  const messageWindow = range.dataDa && range.dataAExclusive
    ? sql`AND m.timestamp >= ${range.dataDa} AND m.timestamp < ${range.dataAExclusive}`
    : range.dataDa
      ? sql`AND m.timestamp >= ${range.dataDa}`
      : range.dataAExclusive
        ? sql`AND m.timestamp < ${range.dataAExclusive}`
        : sql``;
  const preventiviWindow = range.dataDa && range.dataAExclusive
    ? sql`AND p.data_creazione >= ${range.dataDa} AND p.data_creazione < ${range.dataAExclusive}`
    : range.dataDa
      ? sql`AND p.data_creazione >= ${range.dataDa}`
      : range.dataAExclusive
        ? sql`AND p.data_creazione < ${range.dataAExclusive}`
        : sql``;
  const contattiWindow = range.dataDa && range.dataAExclusive
    ? sql`AND cc.data_creazione >= ${range.dataDa} AND cc.data_creazione < ${range.dataAExclusive}`
    : range.dataDa
      ? sql`AND cc.data_creazione >= ${range.dataDa}`
      : range.dataAExclusive
        ? sql`AND cc.data_creazione < ${range.dataAExclusive}`
        : sql``;

  const result = await db.execute(sql`
    (SELECT
      m.id::text,
      'messaggio' as tipo,
      CONCAT('Nuovo messaggio da ', c.nome, ' via ', m.canale) as descrizione,
      m.timestamp,
      c.nome as contatto_nome
    FROM messaggi m
    JOIN contatti_crm c ON c.id = m.contatto_id
    WHERE m.direzione = 'inbound'
      ${messageWindow}
    ORDER BY m.timestamp DESC
    LIMIT 5)
    UNION ALL
    (SELECT
      p.id::text,
      'preventivo' as tipo,
      CONCAT('Preventivo ', p.stato_evento, ' per ', c.nome) as descrizione,
      p.data_creazione as timestamp,
      c.nome as contatto_nome
    FROM preventivi_eventi p
    JOIN contatti_crm c ON c.id = p.contatto_id
    WHERE 1 = 1
      ${preventiviWindow}
    ORDER BY p.data_creazione DESC
    LIMIT 5)
    UNION ALL
    (SELECT
      cc.id::text,
      'contatto' as tipo,
      CONCAT('Nuovo contatto: ', cc.nome, ' (', cc.origine_lead, ')') as descrizione,
      cc.data_creazione as timestamp,
      cc.nome as contatto_nome
    FROM contatti_crm cc
    WHERE 1 = 1
      ${contattiWindow}
    ORDER BY cc.data_creazione DESC
    LIMIT 3)
    ORDER BY timestamp DESC
    LIMIT 10
  `);
  res.json(result.rows);
});

router.get("/calendar/check-availability", async (req, res) => {
  const { data, slot } = req.query as { data?: string; slot?: string };
  if (!data) {
    res.status(400).json({ error: "data parameter required" });
    return;
  }
  if (slot && !isCalendarSlot(slot)) {
    res.status(400).json({ error: "slot parameter must be one of: pranzo, pomeriggio, sera, intera_giornata" });
    return;
  }
  const requestedSlot = isCalendarSlot(slot) ? slot : undefined;

  const [existing] = await db
    .select()
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.data_evento_richiesta, data), eq(preventiviEventiTable.stato_evento, "confermato")));

  let slotDisponibili: CalendarSlot[] = existing ? [] : [...calendarSlots];
  let provider: "internal" | "google" | "combined" = "internal";
  let motivo: string | null = existing ? "Data occupata da un evento confermato interno" : null;

  const googleAvailability = await checkGoogleCalendarAvailability({ data, slot: requestedSlot });
  if (googleAvailability) {
    provider = "combined";
    motivo = googleAvailability.motivo ?? motivo;
    slotDisponibili = slotDisponibili.filter((availableSlot) => googleAvailability.slotDisponibili.includes(availableSlot));
  }

  const disponibile = requestedSlot ? slotDisponibili.includes(requestedSlot) : slotDisponibili.length > 0;

  const alternative: string[] = [];
  if (!disponibile) {
    const baseDate = new Date(data);
    let checked = 0;
    let offset = 1;
    while (alternative.length < 3 && checked < 60) {
      const candidate = new Date(baseDate);
      candidate.setDate(candidate.getDate() + offset);
      const day = candidate.getDay();
      if (day === 5 || day === 0) {
        const candidateStr = toLocalIsoDate(candidate);
        const [conflict] = await db
          .select()
        .from(preventiviEventiTable)
        .where(and(eq(preventiviEventiTable.data_evento_richiesta, candidateStr), eq(preventiviEventiTable.stato_evento, "confermato")));
        if (!conflict) {
          const googleCandidateAvailability = await checkGoogleCalendarAvailability({ data: candidateStr });
          if (!googleCandidateAvailability || googleCandidateAvailability.slotDisponibili.length > 0) {
            alternative.push(candidateStr);
          }
        }
      }
      offset++;
      checked++;
    }
  }

  res.json({
    disponibile,
    provider,
    motivo,
    slot_richiesto: requestedSlot ?? null,
    slot_disponibili: slotDisponibili,
    date_alternative: alternative,
  });
});

export default router;
