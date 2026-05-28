import { Router } from "express";
import { db, agendaPersonaleTable, insertAgendaItemSchema, updateAgendaItemSchema } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const router = Router();

router.get("/agenda", async (req, res) => {
  const { categoria, data_da, data_a } = req.query as Record<string, string>;
  const conditions = [];
  if (categoria) conditions.push(eq(agendaPersonaleTable.categoria, categoria));
  if (data_da) conditions.push(gte(agendaPersonaleTable.data_ora_inizio, new Date(data_da)));
  if (data_a) conditions.push(lte(agendaPersonaleTable.data_ora_fine, new Date(data_a)));

  const rows = await db
    .select()
    .from(agendaPersonaleTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(agendaPersonaleTable.data_ora_inizio);
  res.json(rows);
});

router.post("/agenda", async (req, res) => {
  const parsed = insertAgendaItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    data_ora_inizio: new Date(parsed.data.data_ora_inizio as unknown as string),
    data_ora_fine: new Date(parsed.data.data_ora_fine as unknown as string),
  };
  const [row] = await db.insert(agendaPersonaleTable).values(data).returning();
  res.status(201).json(row);
});

router.get("/agenda/:id", async (req, res) => {
  const [row] = await db.select().from(agendaPersonaleTable).where(eq(agendaPersonaleTable.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.patch("/agenda/:id", async (req, res) => {
  const parsed = updateAgendaItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (data.data_ora_inizio) data.data_ora_inizio = new Date(data.data_ora_inizio as string);
  if (data.data_ora_fine) data.data_ora_fine = new Date(data.data_ora_fine as string);
  const [row] = await db.update(agendaPersonaleTable).set(data).where(eq(agendaPersonaleTable.id, req.params.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/agenda/:id", async (req, res) => {
  await db.delete(agendaPersonaleTable).where(eq(agendaPersonaleTable.id, req.params.id));
  res.status(204).send();
});

export default router;
