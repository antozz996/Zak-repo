import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { b2bCompetitorTable } from "./b2b_competitor";

export const b2bMaterialiTable = pgTable("b2b_materiali", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  competitor_id: text("competitor_id").references(() => b2bCompetitorTable.id, { onDelete: "set null" }),
  nome_file: text("nome_file").notNull(),
  tipo_materiale: text("tipo_materiale").notNull().default("brochure"),
  url: text("url"),
  stato: text("stato").notNull().default("caricato"),
  note: text("note"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
});

export const insertB2BMaterialeSchema = createInsertSchema(b2bMaterialiTable).omit({
  id: true,
  data_creazione: true,
});
export const updateB2BMaterialeSchema = insertB2BMaterialeSchema.partial();
export type B2BMateriale = typeof b2bMaterialiTable.$inferSelect;
export type InsertB2BMateriale = z.infer<typeof insertB2BMaterialeSchema>;
