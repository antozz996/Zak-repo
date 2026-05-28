import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agendaPersonaleTable = pgTable("agenda_personale", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  data_ora_inizio: timestamp("data_ora_inizio").notNull(),
  data_ora_fine: timestamp("data_ora_fine").notNull(),
  categoria: text("categoria").notNull().default("lavoro"),
  promemoria_inviato: boolean("promemoria_inviato").notNull().default(false),
});

export const insertAgendaItemSchema = createInsertSchema(agendaPersonaleTable).omit({ id: true, promemoria_inviato: true });
export const updateAgendaItemSchema = createInsertSchema(agendaPersonaleTable).omit({ id: true }).partial();
export type InsertAgendaItem = z.infer<typeof insertAgendaItemSchema>;
export type AgendaItem = typeof agendaPersonaleTable.$inferSelect;
