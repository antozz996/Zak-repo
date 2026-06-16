import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { preventiviEventiTable } from "./preventivi_eventi";
import { utentiTable } from "./utenti";

export const eventStaffAllocationTable = pgTable(
  "event_staff_allocation",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    event_id: text("event_id").notNull().references(() => preventiviEventiTable.id, { onDelete: "cascade" }),
    user_id: text("user_id").notNull().references(() => utentiTable.id, { onDelete: "cascade" }),
    role_allocated: text("role_allocated").notNull(),
    data_creazione: timestamp("data_creazione").notNull().defaultNow(),
  },
  (table) => [
    index("event_staff_event_idx").on(table.event_id, table.role_allocated),
    index("event_staff_user_idx").on(table.user_id, table.event_id),
  ],
);

export const insertEventStaffAllocationSchema = createInsertSchema(eventStaffAllocationTable)
  .omit({ id: true, data_creazione: true })
  .extend({
    user_id: z.string().min(1),
    role_allocated: z.string().trim().min(1),
  });

export const updateEventStaffAllocationSchema = insertEventStaffAllocationSchema.partial();

export type InsertEventStaffAllocation = z.infer<typeof insertEventStaffAllocationSchema>;
export type EventStaffAllocation = typeof eventStaffAllocationTable.$inferSelect;
