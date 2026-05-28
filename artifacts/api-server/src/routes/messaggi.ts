import { Router } from "express";
import { db, messaggiTable, contattiCrmTable, utentiTable, insertMessaggioSchema } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendWhatsAppTextSafely } from "../lib/whatsapp";

const router = Router();

router.get("/messaggi", async (req, res) => {
  const { canale, contatto_id } = req.query as Record<string, string>;
  const conditions = [];
  if (canale) conditions.push(eq(messaggiTable.canale, canale));
  if (contatto_id) conditions.push(eq(messaggiTable.contatto_id, contatto_id));

  const rows = await db
    .select()
    .from(messaggiTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(messaggiTable.timestamp));
  res.json(rows);
});

router.post("/messaggi", async (req, res) => {
  const parsed = insertMessaggioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(messaggiTable).values({
    ...parsed.data,
    direzione: "outbound",
    mittente_nome: "Staff",
  }).returning();

  const [contatto] = await db
    .select()
    .from(contattiCrmTable)
    .where(eq(contattiCrmTable.id, parsed.data.contatto_id));

  await db.update(contattiCrmTable)
    .set({ ultimo_contatto: new Date() })
    .where(eq(contattiCrmTable.id, parsed.data.contatto_id));

  if (parsed.data.canale === "whatsapp" && contatto?.telefono) {
    await sendWhatsAppTextSafely({
      to: contatto.telefono,
      text: parsed.data.testo,
    });
  }

  res.status(201).json(row);
});

// Unified inbox: one entry per contact with last message
router.get("/chat/inbox", async (req, res) => {
  const inbox = await db.execute(sql`
    SELECT
      c.id as contatto_id,
      c.nome as contatto_nome,
      c.telefono,
      c.stato_lead,
      c.operatore_assegnato_id,
      u.nome as operatore_assegnato_nome,
      m.canale,
      m.testo as ultimo_messaggio,
      m.timestamp,
      COUNT(CASE WHEN m2.letto = false AND m2.direzione = 'inbound' THEN 1 END)::int as non_letti
    FROM contatti_crm c
    INNER JOIN LATERAL (
      SELECT * FROM messaggi WHERE contatto_id = c.id ORDER BY timestamp DESC LIMIT 1
    ) m ON true
    LEFT JOIN messaggi m2 ON m2.contatto_id = c.id
    LEFT JOIN utenti u ON u.id = c.operatore_assegnato_id
    GROUP BY c.id, c.nome, c.telefono, c.stato_lead, c.operatore_assegnato_id, u.nome, m.canale, m.testo, m.timestamp
    ORDER BY m.timestamp DESC
  `);
  res.json(inbox.rows);
});

router.post("/chat/assign", async (req, res) => {
  const { contatto_id, operatore_id } = req.body;
  if (!contatto_id) {
    res.status(400).json({ error: "contatto_id required" });
    return;
  }
  const [row] = await db
    .update(contattiCrmTable)
    .set({ operatore_assegnato_id: operatore_id || null })
    .where(eq(contattiCrmTable.id, contatto_id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (!operatore_id) {
    res.json({ ...row, operatore_assegnato_nome: null });
    return;
  }

  const [operatore] = await db.select().from(utentiTable).where(eq(utentiTable.id, operatore_id));
  res.json({ ...row, operatore_assegnato_nome: operatore?.nome ?? null });
});

export default router;
