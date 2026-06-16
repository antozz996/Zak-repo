import {
  db,
  eventStaffAllocationTable,
  preventiviEventiTable,
  taskPersonaliTable,
  userNotificationsTable,
  utentiTable,
} from "@workspace/db";
import { and, eq, gte, inArray, isNull, lte, ne, notExists } from "drizzle-orm";

type NotificationType = "info" | "success" | "warning" | "danger";

export async function createInternalNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}) {
  const [existing] = await db
    .select()
    .from(userNotificationsTable)
    .where(and(
      eq(userNotificationsTable.user_id, input.userId),
      eq(userNotificationsTable.title, input.title),
      eq(userNotificationsTable.message, input.message),
      eq(userNotificationsTable.is_read, false),
      input.link ? eq(userNotificationsTable.link, input.link) : isNull(userNotificationsTable.link),
    ))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db.insert(userNotificationsTable).values({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
    link: input.link ?? null,
  }).returning();

  return created;
}

export async function notifyManagersAndAdmins(input: {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}) {
  const recipients = await db
    .select({ id: utentiTable.id })
    .from(utentiTable)
    .where(and(
      eq(utentiTable.stato, "attivo"),
      inArray(utentiTable.ruolo, ["manager", "admin"]),
    ));

  return Promise.all(recipients.map((recipient) => createInternalNotification({
    userId: recipient.id,
    title: input.title,
    message: input.message,
    type: input.type,
    link: input.link,
  })));
}

export async function runOperationalNotifications(): Promise<{ eseguiti: number; dettagli: string[] }> {
  const dettagli: string[] = [];
  const now = new Date();
  const tasksDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueTasks = await db
    .select({
      id: taskPersonaliTable.id,
      titolo: taskPersonaliTable.titolo,
      scadenza: taskPersonaliTable.scadenza,
      user_id: taskPersonaliTable.user_id,
    })
    .from(taskPersonaliTable)
    .where(and(
      ne(taskPersonaliTable.stato, "completato"),
      gte(taskPersonaliTable.scadenza, now),
      lte(taskPersonaliTable.scadenza, tasksDeadline),
    ));

  for (const task of dueTasks) {
    if (!task.user_id || !task.scadenza) continue;
    await createInternalNotification({
      userId: task.user_id,
      title: "Task in scadenza",
      message: `"${task.titolo}" scade il ${task.scadenza.toLocaleString("it-IT")}`,
      type: "warning",
      link: "/task",
    });
    dettagli.push(`Notificato task ${task.id}`);
  }

  const staffingDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const unstaffedEvents = await db
    .select({
      id: preventiviEventiTable.id,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
    })
    .from(preventiviEventiTable)
    .where(and(
      inArray(preventiviEventiTable.event_stage, ["confirmed", "in_production"]),
      gte(preventiviEventiTable.data_evento_richiesta, now.toISOString().slice(0, 10)),
      lte(preventiviEventiTable.data_evento_richiesta, staffingDeadline.toISOString().slice(0, 10)),
      notExists(
        db.select({ id: eventStaffAllocationTable.id })
          .from(eventStaffAllocationTable)
          .where(eq(eventStaffAllocationTable.event_id, preventiviEventiTable.id)),
      ),
    ));

  for (const event of unstaffedEvents) {
    await notifyManagersAndAdmins({
      title: "Evento confermato senza staff",
      message: `L'evento ${event.id} del ${event.data_evento_richiesta ?? "data da definire"} non ha ancora staff assegnato.`,
      type: "warning",
      link: `/events/${event.id}`,
    });
    dettagli.push(`Notificato staffing evento ${event.id}`);
  }

  return { eseguiti: dettagli.length, dettagli };
}
