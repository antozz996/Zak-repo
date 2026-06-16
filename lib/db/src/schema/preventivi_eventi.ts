import { date, index, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contattiCrmTable } from "./contatti_crm";

export const preventiviEventiTable = pgTable(
  "preventivi_eventi",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    contatto_id: text("contatto_id").notNull().references(() => contattiCrmTable.id, { onDelete: "cascade" }),
    data_evento_richiesta: date("data_evento_richiesta"),
    numero_invitati: integer("numero_invitati"),
    budget_stimato: numeric("budget_stimato", { precision: 12, scale: 2 }),
    note: text("note"),
    stato_evento: text("stato_evento").notNull().default("opzionato"),
    event_stage: text("event_stage").notNull().default("draft"),
    menu_cibo: text("menu_cibo"),
    menu_bevande: text("menu_bevande"),
    note_allergie: text("note_allergie"),
    note_logistica: text("note_logistica"),
    data_creazione: timestamp("data_creazione").notNull().defaultNow(),
    google_calendar_id: text("google_calendar_id"),
    google_event_id: text("google_event_id"),
    google_sync_status: text("google_sync_status").notNull().default("non_configurato"),
    google_last_synced_at: timestamp("google_last_synced_at"),
  },
  (table) => [
    index("preventivi_contatto_data_idx").on(table.contatto_id, table.data_creazione),
    index("preventivi_stato_data_idx").on(table.stato_evento, table.data_creazione),
    index("preventivi_stato_evento_data_idx").on(table.stato_evento, table.data_evento_richiesta),
    index("preventivi_google_sync_idx").on(table.google_sync_status, table.google_last_synced_at),
  ],
);

export const insertPreventivoSchema = createInsertSchema(preventiviEventiTable).omit({ id: true, data_creazione: true });
export const updatePreventivoSchema = insertPreventivoSchema.partial();
export type InsertPreventivo = z.infer<typeof insertPreventivoSchema>;
export type Preventivo = typeof preventiviEventiTable.$inferSelect;
