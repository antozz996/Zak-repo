import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const googleCalendarSyncStateTable = pgTable("google_calendar_sync_state", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  calendar_id: text("calendar_id").notNull().unique(),
  sync_token: text("sync_token"),
  channel_id: text("channel_id"),
  channel_resource_id: text("channel_resource_id"),
  channel_expiration_at: timestamp("channel_expiration_at"),
  enabled: boolean("enabled").notNull().default(true),
  last_full_sync_at: timestamp("last_full_sync_at"),
  last_incremental_sync_at: timestamp("last_incremental_sync_at"),
  last_error: text("last_error"),
  data_aggiornamento: timestamp("data_aggiornamento").notNull().defaultNow(),
});

export type GoogleCalendarSyncState = typeof googleCalendarSyncStateTable.$inferSelect;
