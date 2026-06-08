import { Router } from "express";
import { db, utentiTable, insertUtenteSchema, updateUtenteSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logAuditAction } from "../lib/audit-log";
import { hashPassword, requireAuth, requireRole, toPublicUser } from "../lib/auth";

const router = Router();

router.use(requireAuth);

router.get("/utenti", requireRole("manager"), async (req, res) => {
  const rows = await db.select().from(utentiTable).orderBy(utentiTable.data_creazione);
  res.json(rows.map(toPublicUser));
});

router.post("/utenti", requireRole("admin"), async (req, res) => {
  const parsed = insertUtenteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...utenteData } = parsed.data;
  const [row] = await db.insert(utentiTable).values({
    ...utenteData,
    email: utenteData.email.toLowerCase(),
    password_hash: password ? await hashPassword(password) : null,
  }).returning();
  await logAuditAction({ req, azione: "create", entita: "utente", entitaId: row.id, dettagli: { email: row.email, ruolo: row.ruolo } });
  res.status(201).json(toPublicUser(row));
});

router.get("/utenti/:id", requireRole("manager"), async (req, res) => {
  const id = String(req.params.id);
  const [row] = await db.select().from(utentiTable).where(eq(utentiTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toPublicUser(row));
});

router.patch("/utenti/:id", requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  const parsed = updateUtenteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...utenteData } = parsed.data;
  const updateData = {
    ...utenteData,
    ...(utenteData.email ? { email: utenteData.email.toLowerCase() } : {}),
    ...(password ? { password_hash: await hashPassword(password) } : {}),
  };
  const [row] = await db.update(utentiTable).set(updateData).where(eq(utentiTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await logAuditAction({ req, azione: "update", entita: "utente", entitaId: row.id, dettagli: { ...utenteData, password_changed: Boolean(password) } });
  res.json(toPublicUser(row));
});

router.delete("/utenti/:id", requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  await db.delete(utentiTable).where(eq(utentiTable.id, id));
  await logAuditAction({ req, azione: "delete", entita: "utente", entitaId: id });
  res.status(204).send();
});

export default router;
