import { index, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { preventiviEventiTable } from "./preventivi_eventi";

export const eventCostSnapshotsTable = pgTable(
  "event_cost_snapshots",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    event_id: text("event_id").notNull().references(() => preventiviEventiTable.id, { onDelete: "cascade" }),
    event_type: text("event_type"),
    snapshot_date: timestamp("snapshot_date").notNull().defaultNow(),
    total_guests: integer("total_guests").notNull(),
    food_cost_per_person: numeric("food_cost_per_person", { precision: 10, scale: 2 }).notNull(),
    beverage_cost_per_person: numeric("beverage_cost_per_person", { precision: 10, scale: 2 }).notNull(),
    fixed_extra_costs: numeric("fixed_extra_costs", { precision: 10, scale: 2 }).notNull(),
    total_revenue: numeric("total_revenue", { precision: 12, scale: 2 }).notNull(),
    calculated_margin_total: numeric("calculated_margin_total", { precision: 12, scale: 2 }).notNull(),
    calculated_margin_percentage: numeric("calculated_margin_percentage", { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [
    index("event_cost_snapshots_event_date_idx").on(table.event_id, table.snapshot_date),
    index("event_cost_snapshots_type_date_idx").on(table.event_type, table.snapshot_date),
  ],
);

export const insertEventCostSnapshotSchema = createInsertSchema(eventCostSnapshotsTable).omit({
  id: true,
  snapshot_date: true,
});

export const updateEventCostSnapshotSchema = insertEventCostSnapshotSchema.partial();

export type InsertEventCostSnapshot = z.infer<typeof insertEventCostSnapshotSchema>;
export type EventCostSnapshot = typeof eventCostSnapshotsTable.$inferSelect;
