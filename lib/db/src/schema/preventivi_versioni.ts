import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { preventiviEventiTable } from "./preventivi_eventi";

export const preventiviVersioniTable = pgTable("preventivi_versioni", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  preventivo_id: text("preventivo_id")
    .notNull()
    .references(() => preventiviEventiTable.id, { onDelete: "cascade" }),
  numero_versione: integer("numero_versione").notNull(),
  snapshot: jsonb("snapshot").notNull().$type<Record<string, unknown>>(),
  nota: text("nota"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
});

export type PreventivoVersione = typeof preventiviVersioniTable.$inferSelect;

