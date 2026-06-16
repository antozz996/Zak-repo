import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whatsappTemplatesTable = pgTable(
  "whatsapp_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    trigger_key: text("trigger_key").notNull().unique(),
    display_name: text("display_name").notNull(),
    template_name: text("template_name"),
    status: text("status").notNull().default("pending"),
    language_code: text("language_code").notNull().default("it"),
    body_preview: text("body_preview"),
    data_creazione: timestamp("data_creazione").notNull().defaultNow(),
    aggiornato_il: timestamp("aggiornato_il").notNull().defaultNow(),
  },
  (table) => [
    index("whatsapp_templates_trigger_idx").on(table.trigger_key),
    index("whatsapp_templates_status_idx").on(table.status),
  ],
);

export const insertWhatsAppTemplateSchema = createInsertSchema(whatsappTemplatesTable)
  .omit({ id: true, data_creazione: true, aggiornato_il: true });
export const updateWhatsAppTemplateSchema = insertWhatsAppTemplateSchema.partial();
export type InsertWhatsAppTemplate = z.infer<typeof insertWhatsAppTemplateSchema>;
export type WhatsAppTemplate = typeof whatsappTemplatesTable.$inferSelect;
