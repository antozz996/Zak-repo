import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const utentiTable = pgTable("utenti", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nome: text("nome").notNull(),
  ruolo: text("ruolo").notNull().default("staff"),
  email: text("email").notNull().unique(),
  stato: text("stato").notNull().default("attivo"),
  password_hash: text("password_hash"),
  data_creazione: timestamp("data_creazione").notNull().defaultNow(),
});

const ruoloUtenteSchema = z.enum(["admin", "manager", "staff"]);
const statoUtenteSchema = z.enum(["attivo", "disattivato"]);

export const insertUtenteSchema = createInsertSchema(utentiTable)
  .omit({ id: true, data_creazione: true, password_hash: true })
  .extend({
    nome: z.string().trim().min(1),
    ruolo: ruoloUtenteSchema.default("staff"),
    email: z.string().trim().email(),
    stato: statoUtenteSchema.default("attivo"),
    password: z.string().min(8).optional(),
  });
export const updateUtenteSchema = insertUtenteSchema.partial();
export type InsertUtente = z.infer<typeof insertUtenteSchema>;
export type Utente = typeof utentiTable.$inferSelect;
