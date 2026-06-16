import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { utentiTable } from "./utenti";

export const userNotificationsTable = pgTable(
  "user_notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull().references(() => utentiTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull().default("info"),
    link: text("link"),
    is_read: boolean("is_read").notNull().default(false),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_notifications_user_unread_idx").on(table.user_id, table.is_read, table.created_at),
  ],
);

export const insertUserNotificationSchema = createInsertSchema(userNotificationsTable)
  .omit({ id: true, is_read: true, created_at: true });
export const updateUserNotificationSchema = insertUserNotificationSchema.partial();
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;
export type UserNotification = typeof userNotificationsTable.$inferSelect;
