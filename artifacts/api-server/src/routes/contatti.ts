import { Router } from "express";
import { db, contattiCrmTable, messaggiTable, insertContattoSchema, updateContattoSchema, utentiTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";

const router = Router();

router.get("/contatti", async (req, res) => {
  const { stato_lead, tipo_evento, origine_lead, search } = req.query as Record<string, string>;

  const conditions = [];
  if (stato_lead) conditions.push(eq(contattiCrmTable.stato_lead, stato_lead));
  if (tipo_evento) conditions.push(eq(contattiCrmTable.tipo_evento, tipo_evento));
  if (origine_lead) conditions.push(eq(contattiCrmTable.origine_lead, origine_lead));
  if (search) conditions.push(or(ilike(contattiCrmTable.nome, `%${search}%`), ilike(contattiCrmTable.telefono, `%${search}%`)));

  const contatti = await db
    .select({
      id: contattiCrmTable.id,
      nome: contattiCrmTable.nome,
      telefono: contattiCrmTable.telefono,
      instagram_username: contattiCrmTable.instagram_username,
      origine_lead: contattiCrmTable.origine_lead,
      tipo_evento: contattiCrmTable.tipo_evento,
      stato_lead: contattiCrmTable.stato_lead,
      data_creazione: contattiCrmTable.data_creazione,
      ultimo_contatto: contattiCrmTable.ultimo_contatto,
      operatore_assegnato_id: contattiCrmTable.operatore_assegnato_id,
      operatore_assegnato_nome: utentiTable.nome,
    })
    .from(contattiCrmTable)
    .leftJoin(utentiTable, eq(contattiCrmTable.operatore_assegnato_id, utentiTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(contattiCrmTable.data_creazione));

  res.json(contatti);
});

router.post("/contatti", async (req, res) => {
  const parsed = insertContattoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(contattiCrmTable).values(parsed.data).returning();
  res.status(201).json({ ...row, operatore_assegnato_nome: null });
});

router.get("/contatti/:id", async (req, res) => {
  const [row] = await db
    .select({
      id: contattiCrmTable.id,
      nome: contattiCrmTable.nome,
      telefono: contattiCrmTable.telefono,
      instagram_username: contattiCrmTable.instagram_username,
      origine_lead: contattiCrmTable.origine_lead,
      tipo_evento: contattiCrmTable.tipo_evento,
      stato_lead: contattiCrmTable.stato_lead,
      data_creazione: contattiCrmTable.data_creazione,
      ultimo_contatto: contattiCrmTable.ultimo_contatto,
      operatore_assegnato_id: contattiCrmTable.operatore_assegnato_id,
      operatore_assegnato_nome: utentiTable.nome,
    })
    .from(contattiCrmTable)
    .leftJoin(utentiTable, eq(contattiCrmTable.operatore_assegnato_id, utentiTable.id))
    .where(eq(contattiCrmTable.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.patch("/contatti/:id", async (req, res) => {
  const parsed = updateContattoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(contattiCrmTable).set(parsed.data).where(eq(contattiCrmTable.id, req.params.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, operatore_assegnato_nome: null });
});

router.delete("/contatti/:id", async (req, res) => {
  await db.delete(contattiCrmTable).where(eq(contattiCrmTable.id, req.params.id));
  res.status(204).send();
});

router.get("/contatti/:id/messaggi", async (req, res) => {
  const rows = await db
    .select()
    .from(messaggiTable)
    .where(eq(messaggiTable.contatto_id, req.params.id))
    .orderBy(messaggiTable.timestamp);
  res.json(rows);
});

export default router;
