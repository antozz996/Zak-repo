import { Router } from "express";
import { auditLogTable, db } from "@workspace/db";
import { and, desc, eq, type SQL } from "drizzle-orm";

const router = Router();

router.get("/audit-log", async (req, res) => {
  const { azione, entita, limit } = req.query as Record<string, string | undefined>;
  const lim = Math.min(parseInt(limit || "100", 10), 300);
  const conditions: SQL[] = [];

  if (azione) conditions.push(eq(auditLogTable.azione, azione));
  if (entita) conditions.push(eq(auditLogTable.entita, entita));

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogTable.data_creazione))
    .limit(lim);

  res.json(rows);
});

export default router;
