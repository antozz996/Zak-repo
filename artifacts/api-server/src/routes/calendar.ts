import { Router } from "express";
import { getGoogleCalendarStatus, syncGoogleCalendar } from "../lib/google-calendar";
import { logAuditAction } from "../lib/audit-log";

const router = Router();

function parseSyncDirection(value: unknown) {
  return value === "zak_to_google" || value === "google_to_zak" || value === "bidirectional"
    ? value
    : "bidirectional";
}

router.get("/calendar/google/status", async (_req, res) => {
  res.json(await getGoogleCalendarStatus());
});

router.post("/calendar/google/sync", async (req, res) => {
  const direction = parseSyncDirection(req.body?.direction);
  const fullSync = req.body?.full_sync === true;
  const daysAhead = Number.isFinite(Number(req.body?.days_ahead)) ? Number(req.body.days_ahead) : 180;

  const result = await syncGoogleCalendar({
    direction,
    fullSync,
    daysAhead: Math.max(1, Math.min(daysAhead, 730)),
  });

  await logAuditAction({
    req,
    azione: "sync",
    entita: "google_calendar",
    dettagli: {
      direction,
      full_sync: fullSync,
      pushed: result.pushed,
      pulled: result.pulled,
      conflicts: result.conflicts,
      errors: result.errors.length,
    },
  });

  res.json(result);
});

export default router;
