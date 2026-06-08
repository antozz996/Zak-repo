import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contattiCrmTable } from "./contatti_crm";

export const agendaPersonaleTable = pgTable("agenda_personale", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titolo: text("titolo").notNull(),
  descrizione: text("descrizione"),
  data_ora_inizio: timestamp("data_ora_inizio").notNull(),
  data_ora_fine: timestamp("data_ora_fine").notNull(),
  categoria: text("categoria").notNull().default("lavoro"),
  contatto_id: text("contatto_id").references(() => contattiCrmTable.id, { onDelete: "set null" }),
  promemoria_inviato: boolean("promemoria_inviato").notNull().default(false),
  google_calendar_id: text("google_calendar_id"),
  google_event_id: text("google_event_id"),
  google_sync_status: text("google_sync_status").notNull().default("non_configurato"),
  google_sync_direction: text("google_sync_direction").notNull().default("bidirectional"),
  google_last_synced_at: timestamp("google_last_synced_at"),
  google_updated_at: timestamp("google_updated_at"),
});

export const insertAgendaItemSchema = createInsertSchema(agendaPersonaleTable).omit({ id: true, promemoria_inviato: true });
export const updateAgendaItemSchema = createInsertSchema(agendaPersonaleTable).omit({ id: true }).partial();
export type InsertAgendaItem = z.infer<typeof insertAgendaItemSchema>;
export type AgendaItem = typeof agendaPersonaleTable.$inferSelect;
