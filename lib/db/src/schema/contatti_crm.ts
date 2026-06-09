import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { utentiTable } from "./utenti";

export const contattiCrmTable = pgTable(
  "contatti_crm",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    nome: text("nome").notNull(),
    telefono: text("telefono").notNull().unique(),
    instagram_username: text("instagram_username"),
    origine_lead: text("origine_lead").notNull().default("manuale"),
    tipo_evento: text("tipo_evento"),
    note_interna: text("note_interna"),
    stato_lead: text("stato_lead").notNull().default("entrata"),
    handoff_richiesto: boolean("handoff_richiesto").notNull().default(false),
    operatore_assegnato_id: text("operatore_assegnato_id").references(() => utentiTable.id, { onDelete: "set null" }),
    data_creazione: timestamp("data_creazione").notNull().defaultNow(),
    ultimo_contatto: timestamp("ultimo_contatto"),
  },
  (table) => [
    index("contatti_stato_data_idx").on(table.stato_lead, table.data_creazione),
    index("contatti_operatore_data_idx").on(table.operatore_assegnato_id, table.data_creazione),
    index("contatti_origine_data_idx").on(table.origine_lead, table.data_creazione),
    index("contatti_tipo_evento_data_idx").on(table.tipo_evento, table.data_creazione),
    index("contatti_ultimo_contatto_idx").on(table.ultimo_contatto),
  ],
);

export const insertContattoSchema = createInsertSchema(contattiCrmTable).omit({ id: true, data_creazione: true });
export const updateContattoSchema = insertContattoSchema.partial();
export type InsertContatto = z.infer<typeof insertContattoSchema>;
export type Contatto = typeof contattiCrmTable.$inferSelect;
