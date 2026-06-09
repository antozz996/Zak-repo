import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contattiCrmTable } from "./contatti_crm";

export const automazioniLogTable = pgTable(
  "automazioni_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tipo: text("tipo").notNull(),
    contatto_id: text("contatto_id").references(() => contattiCrmTable.id, { onDelete: "set null" }),
    contatto_nome: text("contatto_nome"),
    stato: text("stato").notNull().default("eseguito"),
    messaggio: text("messaggio"),
    data_esecuzione: timestamp("data_esecuzione").notNull().defaultNow(),
  },
  (table) => [
    index("automazioni_log_tipo_data_idx").on(table.tipo, table.data_esecuzione),
    index("automazioni_log_stato_data_idx").on(table.stato, table.data_esecuzione),
    index("automazioni_log_contatto_data_idx").on(table.contatto_id, table.data_esecuzione),
  ],
);

export const automazioniConfigTable = pgTable("automazioni_config", {
  chiave: text("chiave").primaryKey(),
  valore: text("valore").notNull(),
  descrizione: text("descrizione"),
  aggiornato_il: timestamp("aggiornato_il").notNull().defaultNow(),
});

export type AutomazioneLog = typeof automazioniLogTable.$inferSelect;
export type AutomazioneConfig = typeof automazioniConfigTable.$inferSelect;
