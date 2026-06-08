import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contattiCrmTable } from "./contatti_crm";

export const bookingConversationStateTable = pgTable("booking_conversation_state", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contatto_id: text("contatto_id").notNull().unique().references(() => contattiCrmTable.id, { onDelete: "cascade" }),
  step_corrente: text("step_corrente").notNull().default("nome"),
  dati_mancanti: text("dati_mancanti").notNull().default(""),
  dati_estratti_json: text("dati_estratti_json").notNull().default("{}"),
  completato: boolean("completato").notNull().default(false),
  ultimo_messaggio_at: timestamp("ultimo_messaggio_at").notNull().defaultNow(),
  data_aggiornamento: timestamp("data_aggiornamento").notNull().defaultNow(),
});

export type BookingConversationState = typeof bookingConversationStateTable.$inferSelect;
