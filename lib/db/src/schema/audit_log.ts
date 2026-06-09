import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { utentiTable } from "./utenti";

export const auditLogTable = pgTable(
  "audit_log",
  {
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
  },
  (table) => [
    index("audit_log_data_idx").on(table.data_creazione),
    index("audit_log_entita_data_idx").on(table.entita, table.data_creazione),
    index("audit_log_azione_data_idx").on(table.azione, table.data_creazione),
    index("audit_log_utente_data_idx").on(table.utente_id, table.data_creazione),
  ],
);

export type AuditLog = typeof auditLogTable.$inferSelect;
