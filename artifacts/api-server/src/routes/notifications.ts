import { Router } from "express";
import { db, userNotificationsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";

const router = Router();

router.get("/notifications/unread", async (req, res) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const rows = await db
    .select()
    .from(userNotificationsTable)
    .where(and(
      eq(userNotificationsTable.user_id, req.authUser.id),
      eq(userNotificationsTable.is_read, false),
    ))
    .orderBy(desc(userNotificationsTable.created_at))
    .limit(20);

  res.json(rows);
});

router.patch("/notifications/:id/read", async (req, res) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [row] = await db
    .update(userNotificationsTable)
    .set({ is_read: true })
    .where(and(
      eq(userNotificationsTable.id, req.params.id),
      eq(userNotificationsTable.user_id, req.authUser.id),
    ))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(row);
});

export default router;
