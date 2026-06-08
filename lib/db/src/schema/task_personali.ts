import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contattiCrmTable } from "./contatti_crm";

export const taskPersonaliTable = pgTable("task_personali", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  stato: text("stato").notNull().default("aperto"),
  priorita: text("priorita").notNull().default("media"),
  scadenza: timestamp("scadenza"),
  contatto_id: text("contatto_id").references(() => contattiCrmTable.id, { onDelete: "set null" }),
  fonte: text("fonte").notNull().default("manuale"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
  completato_il: timestamp("completato_il"),
});

export const insertTaskPersonaleSchema = createInsertSchema(taskPersonaliTable).omit({ id: true, data_creazione: true, completato_il: true });
export const updateTaskPersonaleSchema = createInsertSchema(taskPersonaliTable).omit({ id: true, data_creazione: true }).partial();
export type InsertTaskPersonale = z.infer<typeof insertTaskPersonaleSchema>;
export type TaskPersonale = typeof taskPersonaliTable.$inferSelect;
