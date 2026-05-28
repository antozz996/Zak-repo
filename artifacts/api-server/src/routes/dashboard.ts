import { Router } from "express";
import { db, contattiCrmTable, preventiviEventiTable, messaggiTable, agendaPersonaleTable } from "@workspace/db";
import { eq, count, sql, and, gte } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totaleContatti] = await db.select({ count: count() }).from(contattiCrmTable);
  const [nuoviOggi] = await db.select({ count: count() }).from(contattiCrmTable).where(gte(contattiCrmTable.data_creazione, today));
  const [preventiviAttivi] = await db.select({ count: count() }).from(preventiviEventiTable).where(eq(preventiviEventiTable.stato_evento, "opzionato"));
  const [eventiConfermati] = await db.select({ count: count() }).from(preventiviEventiTable).where(eq(preventiviEventiTable.stato_evento, "confermato"));
  const budgetResult = await db.execute(sql`SELECT COALESCE(SUM(budget_stimato::numeric), 0) as total FROM preventivi_eventi WHERE stato_evento = 'confermato'`);
  const [messaggiNonLetti] = await db.select({ count: count() }).from(messaggiTable).where(and(eq(messaggiTable.letto, false), eq(messaggiTable.direzione, "inbound")));

  res.json({
    totale_contatti: totaleContatti.count,
    nuovi_oggi: nuoviOggi.count,
    preventivi_attivi: preventiviAttivi.count,
    eventi_confermati: eventiConfermati.count,
    budget_totale_confermato: parseFloat((budgetResult.rows[0] as { total: string }).total || "0"),
    messaggi_non_letti: messaggiNonLetti.count,
  });
});

router.get("/dashboard/lead-pipeline", async (req, res) => {
  const result = await db.execute(sql`
    SELECT stato_lead as stato, COUNT(*)::int as count
    FROM contatti_crm
    GROUP BY stato_lead
    ORDER BY count DESC
  `);
  res.json(result.rows);
});

router.get("/dashboard/eventi-mese", async (req, res) => {
  const result = await db.execute(sql`
    SELECT TO_CHAR(data_evento_richiesta::date, 'Mon') as mese,
           EXTRACT(MONTH FROM data_evento_richiesta::date)::int as mese_num,
           COUNT(*)::int as count
    FROM preventivi_eventi
    WHERE stato_evento = 'confermato'
      AND data_evento_richiesta IS NOT NULL
      AND EXTRACT(YEAR FROM data_evento_richiesta::date) = EXTRACT(YEAR FROM NOW())
    GROUP BY mese, mese_num
    ORDER BY mese_num
  `);
  res.json(result.rows);
});

router.get("/dashboard/attivita-recente", async (req, res) => {
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
    ORDER BY cc.data_creazione DESC
    LIMIT 3)
    ORDER BY timestamp DESC
    LIMIT 10
  `);
  res.json(result.rows);
});

router.get("/calendar/check-availability", async (req, res) => {
  const { data } = req.query as { data?: string };
  if (!data) {
    res.status(400).json({ error: "data parameter required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.data_evento_richiesta, data), eq(preventiviEventiTable.stato_evento, "confermato")));

  const disponibile = !existing;

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
  }

  res.json({ disponibile, date_alternative: alternative });
});

export default router;
