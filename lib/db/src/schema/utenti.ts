import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const utentiTable = pgTable("utenti", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nome: text("nome").notNull(),
  ruolo: text("ruolo").notNull().default("staff"),
  email: text("email").notNull().unique(),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
});

export const insertUtenteSchema = createInsertSchema(utentiTable).omit({ id: true, data_creazione: true });
export const updateUtenteSchema = insertUtenteSchema.partial();
export type InsertUtente = z.infer<typeof insertUtenteSchema>;
export type Utente = typeof utentiTable.$inferSelect;
