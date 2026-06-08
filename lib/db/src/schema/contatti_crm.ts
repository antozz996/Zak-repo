import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { utentiTable } from "./utenti";

export const contattiCrmTable = pgTable("contatti_crm", {
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
});

export const insertContattoSchema = createInsertSchema(contattiCrmTable).omit({ id: true, data_creazione: true });
export const updateContattoSchema = insertContattoSchema.partial();
export type InsertContatto = z.infer<typeof insertContattoSchema>;
export type Contatto = typeof contattiCrmTable.$inferSelect;
