import { Router } from "express";
import { db, automazioniLogTable, automazioniConfigTable, contattiCrmTable, preventiviEventiTable } from "@workspace/db";
import { eq, and, lte, desc, sql } from "drizzle-orm";

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

async function getConfigValue(chiave: string, fallback: string): Promise<string> {
  const [row] = await db.select().from(automazioniConfigTable).where(eq(automazioniConfigTable.chiave, chiave));
  return row?.valore ?? fallback;
}

async function logAutomazione(tipo: string, contatto_id: string | null, contatto_nome: string | null, messaggio: string, stato = "eseguito") {
  await db.insert(automazioniLogTable).values({ tipo, contatto_id, contatto_nome, messaggio, stato });
}

// ── Re-engagement lead persi ────────────────────────────────────────────────

export async function runReengagement(): Promise<{ eseguiti: number; dettagli: string[] }> {
  const mesiStr = await getConfigValue("reengagement_mesi", "3");
  const mesi = parseInt(mesiStr, 10);

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - mesi);

  // Contatti con stato_lead = 'perso' e ultimo_contatto più vecchio di X mesi
  const leadPersi = await db
    .select()
    .from(contattiCrmTable)
    .where(
      and(
        eq(contattiCrmTable.stato_lead, "perso"),
        lte(contattiCrmTable.ultimo_contatto, cutoff),
      ),
    );

  const dettagli: string[] = [];

  for (const contatto of leadPersi) {
    const msg = `Ciao ${contatto.nome}! Sono passati alcuni mesi dalla nostra ultima chiacchierata. Siamo sempre disponibili per organizzare il tuo evento speciale. Quando vuoi, scrivici! — Team Zak`;

    // In produzione: chiamata all'API WhatsApp per inviare il messaggio
    // await sendWhatsAppMessage(contatto.telefono, msg);

    await logAutomazione(
      "reengagement",
      contatto.id,
      contatto.nome,
      `Re-engagement inviato a ${contatto.nome} (${contatto.telefono}): "${msg.slice(0, 80)}..."`,
    );

    // Aggiorna ultimo_contatto per non ritriggerare
    await db
      .update(contattiCrmTable)
      .set({ ultimo_contatto: new Date() })
      .where(eq(contattiCrmTable.id, contatto.id));

    dettagli.push(`Re-engagement inviato a ${contatto.nome} (${contatto.telefono})`);
  }

  return { eseguiti: leadPersi.length, dettagli };
}

// ── Ricorrenze annuali ──────────────────────────────────────────────────────

export async function runRicorrenze(): Promise<{ eseguiti: number; dettagli: string[] }> {
  const mesiStr = await getConfigValue("ricorrenza_mesi_anticipo", "10");
  const mesi = parseInt(mesiStr, 10);

  // Trova preventivi confermati la cui data evento è ~10 mesi fa (entro finestra di 7 giorni)
  const dataTarget = new Date();
  dataTarget.setMonth(dataTarget.getMonth() - mesi);

  const inizioFinestr = new Date(dataTarget);
  inizioFinestr.setDate(inizioFinestr.getDate() - 3);
  const fineFinestr = new Date(dataTarget);
  fineFinestr.setDate(fineFinestr.getDate() + 3);

  const inizioStr = inizioFinestr.toISOString().split("T")[0];
  const fineStr = fineFinestr.toISOString().split("T")[0];

  const preventivi = await db.execute(sql`
    SELECT p.id, p.contatto_id, p.data_evento_richiesta, p.tipo_evento_cached,
           c.nome as contatto_nome, c.telefono
    FROM preventivi_eventi p
    JOIN contatti_crm c ON c.id = p.contatto_id
    WHERE p.stato_evento = 'confermato'
      AND p.data_evento_richiesta IS NOT NULL
      AND p.data_evento_richiesta::date BETWEEN ${inizioStr}::date AND ${fineStr}::date
  `);

  const contattiConPrev = await db.execute(sql`
    SELECT p.id, p.contatto_id, p.data_evento_richiesta,
           c.nome as contatto_nome, c.telefono,
           c.tipo_evento
    FROM preventivi_eventi p
    JOIN contatti_crm c ON c.id = p.contatto_id
    WHERE p.stato_evento = 'confermato'
      AND p.data_evento_richiesta IS NOT NULL
      AND p.data_evento_richiesta::date BETWEEN ${inizioStr}::date AND ${fineStr}::date
  `);

  const dettagli: string[] = [];

  for (const row of contattiConPrev.rows as Array<{ id: string; contatto_id: string; contatto_nome: string; telefono: string; tipo_evento: string; data_evento_richiesta: string }>) {
    const tipoEvento = row.tipo_evento || "evento";
    const annoSucc = new Date().getFullYear() + 1;
    const msg = `Ciao ${row.contatto_nome}! L'anno scorso hai festeggiato con noi il tuo ${tipoEvento} — è già ora di pensare a ${annoSucc}! Vuoi prenotare di nuovo? Hai la priorità come cliente affezionato. — Team Zak`;

    await logAutomazione(
      "ricorrenza",
      row.contatto_id,
      row.contatto_nome,
      `Proposta fidelizzazione inviata a ${row.contatto_nome} (${row.telefono}) per ${tipoEvento} del ${row.data_evento_richiesta}`,
    );

    dettagli.push(`Fidelizzazione inviata a ${row.contatto_nome} per ${tipoEvento}`);
  }

  return { eseguiti: contattiConPrev.rows.length, dettagli };
}

// ── API Routes ─────────────────────────────────────────────────────────────

router.get("/automazioni/log", async (req, res) => {
  const { tipo, limit } = req.query as { tipo?: string; limit?: string };
  const lim = Math.min(parseInt(limit || "50", 10), 200);

  const rows = await db
    .select()
    .from(automazioniLogTable)
    .where(tipo ? eq(automazioniLogTable.tipo, tipo) : undefined)
    .orderBy(desc(automazioniLogTable.data_esecuzione))
    .limit(lim);

  res.json(rows);
});

router.get("/automazioni/config", async (req, res) => {
  const rows = await db.select().from(automazioniConfigTable).orderBy(automazioniConfigTable.chiave);
  res.json(rows);
});

router.patch("/automazioni/config/:chiave", async (req, res) => {
  const { valore } = req.body;
  if (!valore) {
    res.status(400).json({ error: "valore required" });
    return;
  }

  const existing = await db.select().from(automazioniConfigTable).where(eq(automazioniConfigTable.chiave, req.params.chiave));
  if (existing.length === 0) {
    res.status(404).json({ error: "Config not found" });
    return;
  }

  const [row] = await db
    .update(automazioniConfigTable)
    .set({ valore, aggiornato_il: new Date() })
    .where(eq(automazioniConfigTable.chiave, req.params.chiave))
    .returning();

  res.json(row);
});

router.post("/automazioni/trigger", async (req, res) => {
  const { tipo } = req.body;
  if (!tipo) {
    res.status(400).json({ error: "tipo required" });
    return;
  }

  let result: { eseguiti: number; dettagli: string[] };

  if (tipo === "reengagement") {
    result = await runReengagement();
  } else if (tipo === "ricorrenza") {
    result = await runRicorrenze();
  } else {
    res.status(400).json({ error: `Tipo sconosciuto: ${tipo}` });
    return;
  }

  res.json(result);
});

export default router;
