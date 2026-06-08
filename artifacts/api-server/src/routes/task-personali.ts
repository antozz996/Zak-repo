import { Router } from "express";
import { db, taskPersonaliTable, contattiCrmTable, insertTaskPersonaleSchema, updateTaskPersonaleSchema } from "@workspace/db";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { logAuditAction } from "../lib/audit-log";

const router = Router();

function parseDate(value: unknown) {
  return typeof value === "string" && value ? new Date(value) : value;
}

router.get("/task-personali", async (req, res) => {
  const { stato, priorita, contatto_id } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (stato) conditions.push(eq(taskPersonaliTable.stato, stato));
  if (priorita) conditions.push(eq(taskPersonaliTable.priorita, priorita));
  if (contatto_id) conditions.push(eq(taskPersonaliTable.contatto_id, contatto_id));

  const rows = await db
    .select({
      id: taskPersonaliTable.id,
      titolo: taskPersonaliTable.titolo,
      descrizione: taskPersonaliTable.descrizione,
      stato: taskPersonaliTable.stato,
      priorita: taskPersonaliTable.priorita,
      scadenza: taskPersonaliTable.scadenza,
      contatto_id: taskPersonaliTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      fonte: taskPersonaliTable.fonte,
      data_creazione: taskPersonaliTable.data_creazione,
      completato_il: taskPersonaliTable.completato_il,
    })
    .from(taskPersonaliTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, taskPersonaliTable.contatto_id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(taskPersonaliTable.data_creazione));

  res.json(rows);
});

router.post("/task-personali", async (req, res) => {
  const parsed = insertTaskPersonaleSchema.safeParse({
    ...req.body,
    scadenza: parseDate(req.body?.scadenza),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(taskPersonaliTable).values(parsed.data).returning();
  await logAuditAction({ req, azione: "create", entita: "task", entitaId: row.id, dettagli: { titolo: row.titolo, fonte: row.fonte } });
  res.status(201).json({ ...row, contatto_nome: null });
});

router.get("/task-personali/:id", async (req, res) => {
  const [row] = await db
    .select({
      id: taskPersonaliTable.id,
      titolo: taskPersonaliTable.titolo,
      descrizione: taskPersonaliTable.descrizione,
      stato: taskPersonaliTable.stato,
      priorita: taskPersonaliTable.priorita,
      scadenza: taskPersonaliTable.scadenza,
      contatto_id: taskPersonaliTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      fonte: taskPersonaliTable.fonte,
      data_creazione: taskPersonaliTable.data_creazione,
      completato_il: taskPersonaliTable.completato_il,
    })
    .from(taskPersonaliTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, taskPersonaliTable.contatto_id))
    .where(eq(taskPersonaliTable.id, req.params.id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(row);
});

router.patch("/task-personali/:id", async (req, res) => {
  const parsed = updateTaskPersonaleSchema.safeParse({
    ...req.body,
    scadenza: parseDate(req.body?.scadenza),
    completato_il: parseDate(req.body?.completato_il),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db.select().from(taskPersonaliTable).where(eq(taskPersonaliTable.id, req.params.id));
  if (!current) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const data = {
    ...parsed.data,
    ...(parsed.data.stato === "completato" && current.stato !== "completato" ? { completato_il: new Date() } : {}),
    ...(parsed.data.stato && parsed.data.stato !== "completato" ? { completato_il: null } : {}),
  };

  const [row] = await db.update(taskPersonaliTable).set(data).where(eq(taskPersonaliTable.id, req.params.id)).returning();
  await logAuditAction({ req, azione: "update", entita: "task", entitaId: row.id, dettagli: parsed.data });
  res.json({ ...row, contatto_nome: null });
});

router.delete("/task-personali/:id", async (req, res) => {
  await db.delete(taskPersonaliTable).where(eq(taskPersonaliTable.id, req.params.id));
  await logAuditAction({ req, azione: "delete", entita: "task", entitaId: req.params.id });
  res.status(204).send();
});

export default router;
