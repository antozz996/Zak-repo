import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const appRoot = resolve(import.meta.dirname, "..");

function readSource(relativePath: string) {
  return readFileSync(resolve(appRoot, relativePath), "utf8");
}

function assertIncludes(source: string, expected: string, label: string) {
  assert.ok(
    source.includes(expected),
    `${label}: expected source to include ${expected}`,
  );
}

const inbox = readSource("src/pages/inbox.tsx");
assertIncludes(inbox, "useGetChatInbox", "Inbox loads unified conversations");
assertIncludes(inbox, "useListMessaggi", "Inbox loads selected chat messages");
assertIncludes(inbox, "getStreamChatEventsUrl", "Inbox uses generated SSE URL");
assertIncludes(inbox, "new EventSource", "Inbox opens realtime SSE stream");
assertIncludes(inbox, "useListChatTyping", "Inbox reads operator typing status");
assertIncludes(inbox, "useUpdateChatTyping", "Inbox updates operator typing status");

const preventivi = readSource("src/pages/preventivi.tsx");
assertIncludes(preventivi, "useListPreventivi", "Preventivi loads quote list");
assertIncludes(preventivi, "useCalculatePreventivoPricing", "Preventivi exposes pricing calculation");
assertIncludes(preventivi, "useCalculatePreventivoFoodCost", "Preventivi exposes food cost calculation");
assertIncludes(preventivi, "getDownloadPreventivoPdfUrl", "Preventivi exposes PDF download");
assertIncludes(preventivi, "useSendPreventivoWhatsApp", "Preventivi exposes WhatsApp send");
assertIncludes(preventivi, "useConfirmPreventivoDigitale", "Preventivi exposes digital confirmation");

const reports = readSource("src/pages/reports.tsx");
assertIncludes(reports, "useGetMarginReports", "Reports page loads margin analytics");
assertIncludes(reports, "ResponsiveContainer", "Reports page renders real charts");

const task = readSource("src/pages/task.tsx");
assertIncludes(task, "useListTaskPersonali", "Task page loads personal tasks");
assertIncludes(task, "useCreateTaskPersonale", "Task page creates personal tasks");
assertIncludes(task, "useUpdateTaskPersonale", "Task page updates personal tasks");
assertIncludes(task, "useDeleteTaskPersonale", "Task page deletes personal tasks");

const app = readSource("src/App.tsx");
assertIncludes(app, 'path="/login"', "Router exposes real Login");
assertIncludes(app, "ProtectedRoute", "Router protects real app routes");
assertIncludes(app, 'path="/inbox"', "Router exposes Inbox");
assertIncludes(app, 'path="/preventivi"', "Router exposes Preventivi");
assertIncludes(app, 'path="/reports"', "Router exposes margin reports");
assertIncludes(app, 'path="/task"', "Router exposes Task");
assertIncludes(app, 'path="/go-live"', "Router exposes Go-live readiness center");
assertIncludes(app, 'path="/agenda/importa-numbers"', "Router exposes Apple Numbers agenda import");

const login = readSource("src/pages/login.tsx");
assertIncludes(login, "useLogin", "Login page authenticates with generated API hook");
assertIncludes(login, "saveAuthSession", "Login page persists auth session");

const protectedRoute = readSource("src/components/auth/protected-route.tsx");
assertIncludes(protectedRoute, "useGetCurrentUser", "Protected route validates current user");
assertIncludes(protectedRoute, "minimumRole", "Protected route enforces frontend RBAC");

const b2b = readSource("src/pages/b2b-competitor.tsx");
assertIncludes(b2b, "useListB2BCompetitor", "B2B page loads real competitor archive");
assertIncludes(b2b, "useCreateB2BCompetitor", "B2B page creates real competitor entries");
assertIncludes(b2b, "useDeleteB2BCompetitor", "B2B page deletes real competitor entries");
assertIncludes(b2b, "useListB2BMateriali", "B2B page loads real competitor materials");
assertIncludes(b2b, "useCreateB2BMateriale", "B2B page creates real competitor materials");
assertIncludes(b2b, "useDeleteB2BMateriale", "B2B page deletes real competitor materials");
assertIncludes(b2b, "useListB2BTemplate", "B2B page loads real co-branding templates");
assertIncludes(b2b, "useCreateB2BTemplate", "B2B page creates real co-branding templates");
assertIncludes(b2b, "useDeleteB2BTemplate", "B2B page deletes real co-branding templates");
assertIncludes(b2b, "useAnalyzeB2BCompetitor", "B2B page generates real structured competitor analysis");
assertIncludes(b2b, "useExportB2BPitch", "B2B page exports real B2B pitch outlines");

const goLive = readSource("src/pages/go-live.tsx");
assertIncludes(goLive, "useGetProductionReadiness", "Go-live page reads backend readiness");
assertIncludes(goLive, "useGetGoogleCalendarStatus", "Go-live page reads Google Calendar status");
assertIncludes(goLive, "useSyncGoogleCalendar", "Go-live page can run Google Calendar sync");

const agendaImportNumbers = readSource("src/pages/agenda-import-numbers.tsx");
assertIncludes(agendaImportNumbers, "useImportAgendaNumbersCsv", "Agenda import page uses Numbers CSV import mutation");

console.log("critical zak-app smoke tests passed");
