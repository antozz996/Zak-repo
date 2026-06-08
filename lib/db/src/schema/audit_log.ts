import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { utentiTable } from "./utenti";

export const auditLogTable = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  utente_id: text("utente_id").references(() => utentiTable.id, { onDelete: "set null" }),
  utente_nome: text("utente_nome"),
  azione: text("azione").notNull(),
  entita: text("entita").notNull(),
  entita_id: text("entita_id"),
  dettagli: text("dettagli"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogTable.$inferSelect;
