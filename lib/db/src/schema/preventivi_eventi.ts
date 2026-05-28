import { pgTable, text, date, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contattiCrmTable } from "./contatti_crm";

export const preventiviEventiTable = pgTable("preventivi_eventi", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contatto_id: text("contatto_id").notNull().references(() => contattiCrmTable.id, { onDelete: "cascade" }),
  data_evento_richiesta: date("data_evento_richiesta"),
  numero_invitati: integer("numero_invitati"),
  budget_stimato: numeric("budget_stimato", { precision: 12, scale: 2 }),
  note: text("note"),
  stato_evento: text("stato_evento").notNull().default("opzionato"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
});

export const insertPreventivoSchema = createInsertSchema(preventiviEventiTable).omit({ id: true, data_creazione: true });
export const updatePreventivoSchema = insertPreventivoSchema.partial();
export type InsertPreventivo = z.infer<typeof insertPreventivoSchema>;
export type Preventivo = typeof preventiviEventiTable.$inferSelect;
