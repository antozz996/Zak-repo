import { date, index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { preventiviEventiTable } from "./preventivi_eventi";

export const eventPaymentsTable = pgTable(
  "event_payments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    event_id: text("event_id").notNull().references(() => preventiviEventiTable.id, { onDelete: "cascade" }),
    payment_type: text("payment_type").notNull().default("acconto_1"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    due_date: date("due_date").notNull(),
    status: text("status").notNull().default("pending"),
    paid_at: timestamp("paid_at"),
    payment_method: text("payment_method"),
    data_creazione: timestamp("data_creazione").notNull().defaultNow(),
  },
  (table) => [
    index("event_payments_event_due_idx").on(table.event_id, table.due_date),
    index("event_payments_status_due_idx").on(table.status, table.due_date),
  ],
);

const paymentTypeSchema = z.enum(["acconto_1", "acconto_2", "saldo"]);
const paymentStatusSchema = z.enum(["pending", "paid"]);

export const insertEventPaymentSchema = createInsertSchema(eventPaymentsTable)
  .omit({ id: true, data_creazione: true })
  .extend({
    payment_type: paymentTypeSchema.default("acconto_1"),
    amount: z.number().min(0),
    due_date: z.string().min(1),
    status: paymentStatusSchema.default("pending"),
    payment_method: z.string().trim().min(1).optional().nullable(),
  });

export const updateEventPaymentSchema = insertEventPaymentSchema.partial();

export type InsertEventPayment = z.infer<typeof insertEventPaymentSchema>;
export type EventPayment = typeof eventPaymentsTable.$inferSelect;
