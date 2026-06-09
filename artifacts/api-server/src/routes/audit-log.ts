import { Router } from "express";
import { auditLogTable, db } from "@workspace/db";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { parseLimit, parseOffset } from "../lib/pagination";

const router = Router();

router.get("/audit-log", async (req, res) => {
  const { azione, entita, limit, offset } = req.query as Record<string, string | undefined>;
  const lim = parseLimit(limit, 100, 300);
  const off = parseOffset(offset);
  const conditions: SQL[] = [];

  if (azione) conditions.push(eq(auditLogTable.azione, azione));
  if (entita) conditions.push(eq(auditLogTable.entita, entita));

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogTable.data_creazione))
    .limit(lim)
    .offset(off);

  res.json(rows);
});

export default router;
