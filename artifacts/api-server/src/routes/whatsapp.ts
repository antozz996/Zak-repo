import { Router } from "express";
import { db, updateWhatsAppTemplateSchema, whatsappLogsTable, whatsappTemplatesTable } from "@workspace/db";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { logAuditAction } from "../lib/audit-log";
import { parseLimit } from "../lib/pagination";
import { listWhatsAppTemplates } from "../lib/whatsapp-template-service";

const router = Router();

router.get("/whatsapp/templates", async (_req, res) => {
  const rows = await listWhatsAppTemplates();
  res.json(rows);
});

router.patch("/whatsapp/templates/:id", async (req, res) => {
  const parsed = updateWhatsAppTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(whatsappTemplatesTable)
    .set({ ...parsed.data, aggiornato_il: new Date() })
    .where(eq(whatsappTemplatesTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({ req, azione: "update", entita: "whatsapp_template", entitaId: row.id, dettagli: parsed.data });
  res.json(row);
});

router.get("/whatsapp/logs", async (req, res) => {
  const { trigger_key, contatto_id, event_id, limit } = req.query as Record<string, string | undefined>;
  const lim = parseLimit(limit, 50, 200);
  const conditions: SQL[] = [];
  if (trigger_key) conditions.push(eq(whatsappLogsTable.trigger_key, trigger_key));
  if (contatto_id) conditions.push(eq(whatsappLogsTable.contatto_id, contatto_id));
  if (event_id) conditions.push(eq(whatsappLogsTable.event_id, event_id));

  const rows = await db
    .select()
    .from(whatsappLogsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(whatsappLogsTable.data_creazione))
    .limit(lim);

  res.json(rows);
});

export default router;
