import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contattiCrmTable } from "./contatti_crm";

export const agendaPersonaleTable = pgTable(
  "agenda_personale",
  {
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
  },
  (table) => [
    index("agenda_inizio_fine_idx").on(table.data_ora_inizio, table.data_ora_fine),
    index("agenda_categoria_inizio_idx").on(table.categoria, table.data_ora_inizio),
    index("agenda_contatto_inizio_idx").on(table.contatto_id, table.data_ora_inizio),
    index("agenda_google_sync_idx").on(table.google_sync_status, table.google_last_synced_at),
  ],
);

export const insertAgendaItemSchema = createInsertSchema(agendaPersonaleTable).omit({ id: true, promemoria_inviato: true });
export const updateAgendaItemSchema = createInsertSchema(agendaPersonaleTable).omit({ id: true }).partial();
export type InsertAgendaItem = z.infer<typeof insertAgendaItemSchema>;
export type AgendaItem = typeof agendaPersonaleTable.$inferSelect;
