import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const b2bCompetitorTable = pgTable("b2b_competitor", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default("location_eventi"),
  citta: text("citta"),
  zona: text("zona"),
  target: text("target"),
  prezzo_medio: integer("prezzo_medio"),
  rating: integer("rating"),
  punti_forza: text("punti_forza"),
  punti_deboli: text("punti_deboli"),
  sito: text("sito"),
  instagram: text("instagram"),
  note: text("note"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
  data_aggiornamento: timestamp("data_aggiornamento").notNull().defaultNow(),
});

export const insertB2BCompetitorSchema = createInsertSchema(b2bCompetitorTable).omit({
  id: true,
  data_creazione: true,
  data_aggiornamento: true,
});
export const updateB2BCompetitorSchema = insertB2BCompetitorSchema.partial();
export type B2BCompetitor = typeof b2bCompetitorTable.$inferSelect;
export type InsertB2BCompetitor = z.infer<typeof insertB2BCompetitorSchema>;
