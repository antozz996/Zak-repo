import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const b2bTemplateTable = pgTable("b2b_template", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titolo: text("titolo").notNull(),
  target_tipo: text("target_tipo").notNull().default("azienda"),
  target_descrizione: text("target_descrizione"),
  messaggio: text("messaggio").notNull(),
  vantaggi: text("vantaggi"),
  cta: text("cta"),
  utilizzi: integer("utilizzi").notNull().default(0),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
  data_aggiornamento: timestamp("data_aggiornamento").notNull().defaultNow(),
});

export const insertB2BTemplateSchema = createInsertSchema(b2bTemplateTable).omit({
  id: true,
  data_creazione: true,
  data_aggiornamento: true,
});
export const updateB2BTemplateSchema = insertB2BTemplateSchema.partial();
export type B2BTemplate = typeof b2bTemplateTable.$inferSelect;
export type InsertB2BTemplate = z.infer<typeof insertB2BTemplateSchema>;
