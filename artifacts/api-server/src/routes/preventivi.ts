import { Router } from "express";
import { db, preventiviEventiTable, contattiCrmTable, insertPreventivoSchema, updatePreventivoSchema } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/preventivi", async (req, res) => {
  const { stato_evento, contatto_id } = req.query as Record<string, string>;
  const conditions = [];
  if (stato_evento) conditions.push(eq(preventiviEventiTable.stato_evento, stato_evento));
  if (contatto_id) conditions.push(eq(preventiviEventiTable.contatto_id, contatto_id));

  const rows = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      data_creazione: preventiviEventiTable.data_creazione,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(preventiviEventiTable.data_creazione));

  res.json(rows);
});

router.post("/preventivi", async (req, res) => {
  const parsed = insertPreventivoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(preventiviEventiTable).values(parsed.data).returning();
  res.status(201).json({ ...row, contatto_nome: null });
});

router.get("/preventivi/:id", async (req, res) => {
  const [row] = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      data_creazione: preventiviEventiTable.data_creazione,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(eq(preventiviEventiTable.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.patch("/preventivi/:id", async (req, res) => {
  const parsed = updatePreventivoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(preventiviEventiTable).set(parsed.data).where(eq(preventiviEventiTable.id, req.params.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, contatto_nome: null });
});

router.delete("/preventivi/:id", async (req, res) => {
  await db.delete(preventiviEventiTable).where(eq(preventiviEventiTable.id, req.params.id));
  res.status(204).send();
});

export default router;
