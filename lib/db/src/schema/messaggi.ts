import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contattiCrmTable } from "./contatti_crm";

export const messaggiTable = pgTable("messaggi", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contatto_id: text("contatto_id").notNull().references(() => contattiCrmTable.id, { onDelete: "cascade" }),
  canale: text("canale").notNull().default("whatsapp"),
  direzione: text("direzione").notNull().default("inbound"),
  testo: text("testo").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  letto: boolean("letto").notNull().default(false),
  mittente_nome: text("mittente_nome"),
});

export const insertMessaggioSchema = createInsertSchema(messaggiTable).omit({ id: true, timestamp: true, letto: true });
export type InsertMessaggio = z.infer<typeof insertMessaggioSchema>;
export type Messaggio = typeof messaggiTable.$inferSelect;
