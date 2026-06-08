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
  media_id: text("media_id"),
  media_tipo: text("media_tipo"),
  media_mime_type: text("media_mime_type"),
  media_sha256: text("media_sha256"),
  media_filename: text("media_filename"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  letto: boolean("letto").notNull().default(false),
  mittente_nome: text("mittente_nome"),
});

export const insertMessaggioSchema = createInsertSchema(messaggiTable).omit({ id: true, timestamp: true, letto: true });
export type InsertMessaggio = z.infer<typeof insertMessaggioSchema>;
export type Messaggio = typeof messaggiTable.$inferSelect;
