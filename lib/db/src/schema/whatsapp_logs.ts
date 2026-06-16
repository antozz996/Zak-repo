import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contattiCrmTable } from "./contatti_crm";
import { preventiviEventiTable } from "./preventivi_eventi";
import { whatsappTemplatesTable } from "./whatsapp_templates";

export const whatsappLogsTable = pgTable(
  "whatsapp_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    template_id: text("template_id").references(() => whatsappTemplatesTable.id, { onDelete: "set null" }),
    template_name: text("template_name"),
    trigger_key: text("trigger_key"),
    destinatario: text("destinatario").notNull(),
    contatto_id: text("contatto_id").references(() => contattiCrmTable.id, { onDelete: "set null" }),
    event_id: text("event_id").references(() => preventiviEventiTable.id, { onDelete: "set null" }),
    stato_invio: text("stato_invio").notNull().default("pending"),
    provider_message_id: text("provider_message_id"),
    errore: text("errore"),
    payload_json: text("payload_json"),
    data_creazione: timestamp("data_creazione").notNull().defaultNow(),
  },
  (table) => [
    index("whatsapp_logs_trigger_idx").on(table.trigger_key, table.data_creazione),
    index("whatsapp_logs_contatto_idx").on(table.contatto_id, table.data_creazione),
    index("whatsapp_logs_event_idx").on(table.event_id, table.data_creazione),
  ],
);

export type WhatsAppLog = typeof whatsappLogsTable.$inferSelect;
