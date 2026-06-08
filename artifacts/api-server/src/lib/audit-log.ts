import type { Request } from "express";
import { auditLogTable, db } from "@workspace/db";

type AuditInput = {
  req: Request;
  azione: string;
  entita: string;
  entitaId?: string | null;
  dettagli?: Record<string, unknown>;
};

export async function logAuditAction({ req, azione, entita, entitaId, dettagli }: AuditInput) {
  try {
    await db.insert(auditLogTable).values({
      utente_id: req.header("x-staff-id") || null,
      utente_nome: req.header("x-staff-name") || "staff_ui",
      azione,
      entita,
      entita_id: entitaId ?? null,
      dettagli: dettagli ? JSON.stringify(dettagli) : null,
      ip_address: req.ip,
      user_agent: req.header("user-agent") || null,
    });
  } catch (error) {
    req.log?.warn({ error, azione, entita, entitaId }, "audit log write failed");
  }
}
