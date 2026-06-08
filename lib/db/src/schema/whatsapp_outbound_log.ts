import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contattiCrmTable } from "./contatti_crm";

export const whatsappOutboundLogTable = pgTable("whatsapp_outbound_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contatto_id: text("contatto_id").references(() => contattiCrmTable.id, { onDelete: "set null" }),
  telefono: text("telefono").notNull(),
  sorgente: text("sorgente").notNull(),
  stato: text("stato").notNull(),
  provider_message_id: text("provider_message_id"),
  delivery_status: text("delivery_status"),
  delivery_updated_at: timestamp("delivery_updated_at"),
  provider_error_code: text("provider_error_code"),
  provider_error_message: text("provider_error_message"),
  errore: text("errore"),
  messaggio_excerpt: text("messaggio_excerpt"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
});

export type WhatsAppOutboundLog = typeof whatsappOutboundLogTable.$inferSelect;
