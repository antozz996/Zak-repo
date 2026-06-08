import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contattiCrmTable } from "./contatti_crm";

export const statoLeadStoricoTable = pgTable("stato_lead_storico", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contatto_id: text("contatto_id").notNull().references(() => contattiCrmTable.id, { onDelete: "cascade" }),
  stato_precedente: text("stato_precedente"),
  stato_successivo: text("stato_successivo").notNull(),
  origine: text("origine").notNull().default("sistema"),
  nota: text("nota"),
  data_cambio: timestamp("data_cambio").notNull().defaultNow(),
});

export type StatoLeadStorico = typeof statoLeadStoricoTable.$inferSelect;
