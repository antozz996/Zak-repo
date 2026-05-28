import { Router } from "express";
import { db, utentiTable, insertUtenteSchema, updateUtenteSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/utenti", async (req, res) => {
  const rows = await db.select().from(utentiTable).orderBy(utentiTable.data_creazione);
  res.json(rows);
});

router.post("/utenti", async (req, res) => {
  const parsed = insertUtenteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(utentiTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.get("/utenti/:id", async (req, res) => {
  const [row] = await db.select().from(utentiTable).where(eq(utentiTable.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.patch("/utenti/:id", async (req, res) => {
  const parsed = updateUtenteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(utentiTable).set(parsed.data).where(eq(utentiTable.id, req.params.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/utenti/:id", async (req, res) => {
  await db.delete(utentiTable).where(eq(utentiTable.id, req.params.id));
  res.status(204).send();
});

export default router;
