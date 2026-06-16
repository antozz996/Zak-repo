import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import {
  agendaPersonaleTable,
  contattiCrmTable,
  db,
  googleCalendarSyncStateTable,
  preventiviEventiTable,
  type AgendaItem,
  type Preventivo,
} from "@workspace/db";

export const calendarSlots = ["pranzo", "pomeriggio", "sera", "intera_giornata"] as const;
export type CalendarSlot = (typeof calendarSlots)[number];

type GoogleEvent = {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  updated?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  extendedProperties?: {
    private?: Record<string, string>;
  };
};

type GoogleEventsList = {
  items?: GoogleEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
};

type GoogleFreeBusy = {
  calendars?: Record<string, {
    busy?: Array<{ start: string; end: string }>;
    errors?: Array<{ reason?: string }>;
  }>;
};

const defaultTimeZone = "Europe/Rome";

export function getGoogleCalendarConfig() {
  const requiredEnv = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
  ];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  const enabled = process.env["ZAK_GOOGLE_CALENDAR_ENABLED"] === "true";
  const configured = enabled && missing.length === 0;
  return {
    enabled,
    configured,
    missing,
    calendarId: process.env["GOOGLE_CALENDAR_ID"] || "primary",
    timeZone: process.env["GOOGLE_CALENDAR_TIMEZONE"] || defaultTimeZone,
    mode: configured ? "env_refresh_token" as const : "non_configurato" as const,
    clientId: process.env["GOOGLE_CLIENT_ID"],
    clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
    refreshToken: process.env["GOOGLE_REFRESH_TOKEN"],
  };
}

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetForDate(date: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+1";
  const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "+01:00";
  const sign = match[1];
  const hours = String(match[2]).padStart(2, "0");
  const minutes = String(match[3] ?? "00").padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

function localDateTime(date: string, hour: number, minute = 0, timeZone = defaultTimeZone) {
  const actualDate = hour >= 24 ? addDays(date, 1) : date;
  const actualHour = hour >= 24 ? hour - 24 : hour;
  return `${actualDate}T${String(actualHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offsetForDate(actualDate, timeZone)}`;
}

function slotRange(date: string, slot: CalendarSlot, timeZone: string) {
  if (slot === "pranzo") return { start: localDateTime(date, 12, 0, timeZone), end: localDateTime(date, 16, 0, timeZone) };
  if (slot === "pomeriggio") return { start: localDateTime(date, 16, 0, timeZone), end: localDateTime(date, 20, 0, timeZone) };
  if (slot === "sera") return { start: localDateTime(date, 20, 0, timeZone), end: localDateTime(date, 26, 0, timeZone) };
  return { start: localDateTime(date, 10, 0, timeZone), end: localDateTime(date, 23, 59, timeZone) };
}

function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return new Date(a.start).getTime() < new Date(b.end).getTime()
    && new Date(a.end).getTime() > new Date(b.start).getTime();
}

async function getAccessToken() {
  const config = getGoogleCalendarConfig();
  if (!config.configured || !config.clientId || !config.clientSecret || !config.refreshToken) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth token refresh failed: ${response.status}`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("Google OAuth token refresh did not return access_token");
  return payload.access_token;
}

async function googleFetch<T>(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Google Calendar is not configured");
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar API failed ${response.status}: ${text.slice(0, 200)}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

async function upsertSyncState(values: Partial<typeof googleCalendarSyncStateTable.$inferInsert> & { calendar_id: string }) {
  const now = new Date();
  await db.insert(googleCalendarSyncStateTable)
    .values({ enabled: true, data_aggiornamento: now, ...values })
    .onConflictDoUpdate({
      target: googleCalendarSyncStateTable.calendar_id,
      set: { ...values, data_aggiornamento: now },
    });
}

export async function getGoogleCalendarStatus() {
  const config = getGoogleCalendarConfig();
  const [state] = await db
    .select()
    .from(googleCalendarSyncStateTable)
    .where(eq(googleCalendarSyncStateTable.calendar_id, config.calendarId));
  return {
    configured: config.configured,
    enabled: config.enabled,
    calendar_id: config.calendarId,
    mode: config.mode,
    last_full_sync_at: state?.last_full_sync_at?.toISOString() ?? null,
    last_incremental_sync_at: state?.last_incremental_sync_at?.toISOString() ?? null,
    sync_token_available: Boolean(state?.sync_token),
    last_error: state?.last_error ?? null,
    required_env: config.missing,
  };
}

export async function checkGoogleCalendarAvailability(input: {
  data: string;
  slot?: CalendarSlot;
}): Promise<{ slotDisponibili: CalendarSlot[]; motivo: string | null } | null> {
  const config = getGoogleCalendarConfig();
  if (!config.configured) return null;

  try {
    const slotsToCheck = input.slot ? [input.slot] : [...calendarSlots];
    const fullRange = slotRange(input.data, "intera_giornata", config.timeZone);
    const freeBusy = await googleFetch<GoogleFreeBusy>("/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: fullRange.start,
        timeMax: fullRange.end,
        timeZone: config.timeZone,
        items: [{ id: config.calendarId }],
      }),
    });
    const calendar = freeBusy.calendars?.[config.calendarId];
    if (calendar?.errors?.length) {
      return { slotDisponibili: [], motivo: calendar.errors.map((error) => error.reason).filter(Boolean).join(", ") || "Errore Google Calendar" };
    }
    const busy = calendar?.busy ?? [];
    const slotDisponibili = slotsToCheck.filter((slot) => {
      const range = slotRange(input.data, slot, config.timeZone);
      return !busy.some((item) => overlaps(range, item));
    });
    return { slotDisponibili, motivo: null };
  } catch (error) {
    return { slotDisponibili: [], motivo: error instanceof Error ? error.message : "Errore Google Calendar" };
  }
}

function agendaToGoogleEvent(item: AgendaItem, calendarId: string, timeZone: string): GoogleEvent {
  return {
    summary: item.titolo,
    description: `${item.descrizione ?? ""}\n\nZAK_AGENDA_ID:${item.id}`.trim(),
    start: { dateTime: item.data_ora_inizio.toISOString(), timeZone },
    end: { dateTime: item.data_ora_fine.toISOString(), timeZone },
    extendedProperties: {
      private: {
        zak_entity_type: "agenda",
        zak_entity_id: item.id,
        zak_calendar_id: calendarId,
      },
    },
  };
}

function preventivoToGoogleEvent(preventivo: Preventivo & { contatto_nome?: string | null }, calendarId: string): GoogleEvent | null {
  if (!preventivo.data_evento_richiesta || preventivo.stato_evento !== "confermato") return null;
  return {
    summary: `Evento confermato ZAK - ${preventivo.contatto_nome ?? "Cliente"}`,
    description: [
      `ZAK_PREVENTIVO_ID:${preventivo.id}`,
      preventivo.numero_invitati ? `Invitati: ${preventivo.numero_invitati}` : null,
      preventivo.budget_stimato ? `Budget: ${preventivo.budget_stimato}` : null,
      preventivo.note,
    ].filter(Boolean).join("\n"),
    start: { date: preventivo.data_evento_richiesta },
    end: { date: addDays(preventivo.data_evento_richiesta, 1) },
    extendedProperties: {
      private: {
        zak_entity_type: "preventivo",
        zak_entity_id: preventivo.id,
        zak_calendar_id: calendarId,
      },
    },
  };
}

export async function syncPreventivoToGoogle(preventivo: Preventivo & { contatto_nome?: string | null }) {
  const config = getGoogleCalendarConfig();
  if (!config.configured) return { synced: false, reason: "Google Calendar non configurato" };
  const event = preventivoToGoogleEvent(preventivo, config.calendarId);
  if (!event) return { synced: false, reason: "Preventivo non confermato o senza data evento" };

  try {
    const path = preventivo.google_event_id
      ? `/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(preventivo.google_event_id)}`
      : `/calendars/${encodeURIComponent(config.calendarId)}/events`;
    const method = preventivo.google_event_id ? "PUT" : "POST";
    const synced = await googleFetch<GoogleEvent>(path, { method, body: JSON.stringify(event) });
    await db.update(preventiviEventiTable)
      .set({
        google_calendar_id: config.calendarId,
        google_event_id: synced.id ?? preventivo.google_event_id,
        google_sync_status: "synced",
        google_last_synced_at: new Date(),
      })
      .where(eq(preventiviEventiTable.id, preventivo.id));
    return { synced: true, reason: null };
  } catch (error) {
    await db.update(preventiviEventiTable)
      .set({ google_sync_status: "error", google_last_synced_at: new Date() })
      .where(eq(preventiviEventiTable.id, preventivo.id));
    return { synced: false, reason: error instanceof Error ? error.message : "Errore Google Calendar" };
  }
}

export async function syncAgendaItemToGoogle(item: AgendaItem) {
  const config = getGoogleCalendarConfig();
  if (!config.configured) return { synced: false, reason: "Google Calendar non configurato" };
  const event = agendaToGoogleEvent(item, config.calendarId, config.timeZone);
  try {
    const path = item.google_event_id
      ? `/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(item.google_event_id)}`
      : `/calendars/${encodeURIComponent(config.calendarId)}/events`;
    const method = item.google_event_id ? "PUT" : "POST";
    const synced = await googleFetch<GoogleEvent>(path, { method, body: JSON.stringify(event) });
    await db.update(agendaPersonaleTable)
      .set({
        google_calendar_id: config.calendarId,
        google_event_id: synced.id ?? item.google_event_id,
        google_sync_status: "synced",
        google_sync_direction: "bidirectional",
        google_last_synced_at: new Date(),
        google_updated_at: synced.updated ? new Date(synced.updated) : new Date(),
      })
      .where(eq(agendaPersonaleTable.id, item.id));
    return { synced: true, reason: null };
  } catch (error) {
    await db.update(agendaPersonaleTable)
      .set({ google_sync_status: "error", google_last_synced_at: new Date() })
      .where(eq(agendaPersonaleTable.id, item.id));
    return { synced: false, reason: error instanceof Error ? error.message : "Errore Google Calendar" };
  }
}

export async function deleteGoogleCalendarEvent(eventId?: string | null) {
  const config = getGoogleCalendarConfig();
  if (!config.configured || !eventId) return;
  try {
    await googleFetch<void>(`/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  } catch {
    // Deleting the local item must not be blocked by a provider-side cleanup failure.
  }
}

async function syncConfirmedPreventiviToGoogle() {
  const config = getGoogleCalendarConfig();
  const rows = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      event_stage: preventiviEventiTable.event_stage,
      menu_cibo: preventiviEventiTable.menu_cibo,
      menu_bevande: preventiviEventiTable.menu_bevande,
      note_allergie: preventiviEventiTable.note_allergie,
      note_logistica: preventiviEventiTable.note_logistica,
      data_creazione: preventiviEventiTable.data_creazione,
      google_calendar_id: preventiviEventiTable.google_calendar_id,
      google_event_id: preventiviEventiTable.google_event_id,
      google_sync_status: preventiviEventiTable.google_sync_status,
      google_last_synced_at: preventiviEventiTable.google_last_synced_at,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, preventiviEventiTable.contatto_id))
    .where(and(eq(preventiviEventiTable.stato_evento, "confermato"), isNotNull(preventiviEventiTable.data_evento_richiesta)));

  let pushed = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const result = await syncPreventivoToGoogle(row);
    if (result.synced) pushed++;
    else if (result.reason) errors.push(result.reason);
  }
  return { pushed, errors };
}

async function syncAgendaToGoogle() {
  const rows = await db.select().from(agendaPersonaleTable);
  let pushed = 0;
  const errors: string[] = [];
  for (const row of rows) {
    if (row.google_sync_direction === "google") continue;
    const result = await syncAgendaItemToGoogle(row);
    if (result.synced) pushed++;
    else if (result.reason) errors.push(result.reason);
  }
  return { pushed, errors };
}

function eventStartEnd(event: GoogleEvent) {
  const start = event.start?.dateTime ? new Date(event.start.dateTime) : event.start?.date ? new Date(`${event.start.date}T09:00:00`) : null;
  const end = event.end?.dateTime ? new Date(event.end.dateTime) : event.end?.date ? new Date(`${event.end.date}T10:00:00`) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

async function hasAgendaOverlap(start: Date, end: Date, ignoreGoogleEventId?: string) {
  const rows = await db.select().from(agendaPersonaleTable)
    .where(and(lte(agendaPersonaleTable.data_ora_inizio, end), gte(agendaPersonaleTable.data_ora_fine, start)));
  return rows.some((row) => row.google_event_id !== ignoreGoogleEventId);
}

async function pullGoogleEvents(fullSync: boolean, daysAhead: number) {
  const config = getGoogleCalendarConfig();
  const [state] = await db
    .select()
    .from(googleCalendarSyncStateTable)
    .where(eq(googleCalendarSyncStateTable.calendar_id, config.calendarId));
  const now = new Date();
  const params = new URLSearchParams({
    singleEvents: "true",
    showDeleted: "true",
    maxResults: "2500",
  });
  if (!fullSync && state?.sync_token) {
    params.set("syncToken", state.sync_token);
  } else {
    params.set("timeMin", now.toISOString());
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + daysAhead);
    params.set("timeMax", maxDate.toISOString());
  }

  let pulled = 0;
  let conflicts = 0;
  let skipped = 0;
  const errors: string[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    if (pageToken) params.set("pageToken", pageToken);
    try {
      const list = await googleFetch<GoogleEventsList>(`/calendars/${encodeURIComponent(config.calendarId)}/events?${params.toString()}`);
      for (const event of list.items ?? []) {
        const zakEntityType = event.extendedProperties?.private?.["zak_entity_type"];
        const zakEntityId = event.extendedProperties?.private?.["zak_entity_id"];
        if (zakEntityType === "preventivo") {
          skipped++;
          continue;
        }
        if (event.status === "cancelled") {
          if (process.env["ZAK_GOOGLE_DELETE_CANCELLED"] === "true") {
            await db.delete(agendaPersonaleTable).where(eq(agendaPersonaleTable.google_event_id, event.id ?? ""));
          } else if (event.id) {
            await db.update(agendaPersonaleTable)
              .set({ google_sync_status: "conflict", google_last_synced_at: new Date() })
              .where(eq(agendaPersonaleTable.google_event_id, event.id));
          }
          skipped++;
          continue;
        }
        const range = eventStartEnd(event);
        if (!event.id || !range) {
          skipped++;
          continue;
        }
        const overlap = await hasAgendaOverlap(range.start, range.end, event.id);
        const [existingByGoogleId] = await db.select().from(agendaPersonaleTable).where(eq(agendaPersonaleTable.google_event_id, event.id));
        const status = overlap && !existingByGoogleId ? "conflict" : "synced";
        if (status === "conflict") conflicts++;

        if (existingByGoogleId) {
          await db.update(agendaPersonaleTable)
            .set({
              titolo: event.summary || existingByGoogleId.titolo,
              descrizione: event.description ?? existingByGoogleId.descrizione,
              data_ora_inizio: range.start,
              data_ora_fine: range.end,
              google_calendar_id: config.calendarId,
              google_event_id: event.id,
              google_sync_status: status,
              google_sync_direction: "bidirectional",
              google_last_synced_at: new Date(),
              google_updated_at: event.updated ? new Date(event.updated) : new Date(),
            })
            .where(eq(agendaPersonaleTable.id, existingByGoogleId.id));
        } else if (zakEntityType === "agenda" && zakEntityId) {
          await db.update(agendaPersonaleTable)
            .set({
              google_calendar_id: config.calendarId,
              google_event_id: event.id,
              google_sync_status: status,
              google_sync_direction: "bidirectional",
              google_last_synced_at: new Date(),
              google_updated_at: event.updated ? new Date(event.updated) : new Date(),
            })
            .where(eq(agendaPersonaleTable.id, zakEntityId));
        } else {
          await db.insert(agendaPersonaleTable).values({
            titolo: event.summary || "Evento Google Calendar",
            descrizione: event.description ?? "Importato da Google Calendar",
            data_ora_inizio: range.start,
            data_ora_fine: range.end,
            categoria: "google",
            google_calendar_id: config.calendarId,
            google_event_id: event.id,
            google_sync_status: status,
            google_sync_direction: "google",
            google_last_synced_at: new Date(),
            google_updated_at: event.updated ? new Date(event.updated) : new Date(),
          });
        }
        pulled++;
      }
      pageToken = list.nextPageToken;
      nextSyncToken = list.nextSyncToken ?? nextSyncToken;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore sync Google";
      errors.push(message);
      if (message.includes("410")) {
        await upsertSyncState({ calendar_id: config.calendarId, sync_token: null, last_error: "Sync token scaduto, rieseguire full sync" });
      }
      break;
    }
  } while (pageToken);

  if (nextSyncToken) {
    await upsertSyncState({
      calendar_id: config.calendarId,
      sync_token: nextSyncToken,
      last_full_sync_at: fullSync || !state?.sync_token ? new Date() : state?.last_full_sync_at,
      last_incremental_sync_at: fullSync ? state?.last_incremental_sync_at : new Date(),
      last_error: errors[0] ?? null,
    });
  }
  return { pulled, skipped, conflicts, errors };
}

export async function syncGoogleCalendar(input: {
  direction?: "zak_to_google" | "google_to_zak" | "bidirectional";
  fullSync?: boolean;
  daysAhead?: number;
}) {
  const config = getGoogleCalendarConfig();
  const direction = input.direction ?? "bidirectional";
  if (!config.configured) {
    return {
      configured: false,
      direction,
      pushed: 0,
      pulled: 0,
      skipped: 0,
      conflicts: 0,
      errors: config.missing.map((key) => `Manca ${key}`),
      message: "Google Calendar non configurato",
    };
  }

  let pushed = 0;
  let pulled = 0;
  let skipped = 0;
  let conflicts = 0;
  const errors: string[] = [];

  if (direction === "zak_to_google" || direction === "bidirectional") {
    const agenda = await syncAgendaToGoogle();
    const preventivi = await syncConfirmedPreventiviToGoogle();
    pushed += agenda.pushed + preventivi.pushed;
    errors.push(...agenda.errors, ...preventivi.errors);
  }

  if (direction === "google_to_zak" || direction === "bidirectional") {
    const google = await pullGoogleEvents(Boolean(input.fullSync), input.daysAhead ?? 180);
    pulled += google.pulled;
    skipped += google.skipped;
    conflicts += google.conflicts;
    errors.push(...google.errors);
  }

  await upsertSyncState({
    calendar_id: config.calendarId,
    last_error: errors[0] ?? null,
  });

  return {
    configured: true,
    direction,
    pushed,
    pulled,
    skipped,
    conflicts,
    errors,
    message: errors.length > 0 ? "Sync completata con errori" : "Sync Google Calendar completata",
  };
}
