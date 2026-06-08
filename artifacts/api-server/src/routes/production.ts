import { Router } from "express";

const router = Router();

type ReadinessStatus = "ok" | "warning" | "missing";

function check(key: string, status: ReadinessStatus, message: string) {
  return { key, status, message };
}

function hasAny(...keys: string[]) {
  return keys.some((key) => Boolean(process.env[key]));
}

router.get("/production/readiness", (_req, res) => {
  const checks = [
    check(
      "DATABASE_URL",
      process.env["DATABASE_URL"] ? "ok" : "missing",
      process.env["DATABASE_URL"] ? "Database configurato" : "DATABASE_URL mancante: il backend non puo usare PostgreSQL reale",
    ),
    check(
      "PORT",
      process.env["PORT"] ? "ok" : "warning",
      process.env["PORT"] ? "Porta backend configurata" : "PORT non configurata: in produzione va impostata dall'host",
    ),
    check(
      "ZAK_AUTH_SECRET",
      hasAny("ZAK_AUTH_SECRET", "SESSION_SECRET") ? "ok" : "missing",
      hasAny("ZAK_AUTH_SECRET", "SESSION_SECRET") ? "Segreto sessione staff configurato" : "Manca ZAK_AUTH_SECRET o SESSION_SECRET",
    ),
    check(
      "ZAK_BOOTSTRAP_ADMIN_TOKEN",
      process.env["ZAK_BOOTSTRAP_ADMIN_TOKEN"] ? "ok" : "warning",
      process.env["ZAK_BOOTSTRAP_ADMIN_TOKEN"] ? "Bootstrap admin protetto" : "Consigliato configurare ZAK_BOOTSTRAP_ADMIN_TOKEN prima del go-live",
    ),
    check(
      "META_WHATSAPP",
      hasAny("META_WHATSAPP_ACCESS_TOKEN") && hasAny("META_WHATSAPP_PHONE_NUMBER_ID") && hasAny("META_APP_SECRET")
        ? "ok"
        : "warning",
      "Meta WhatsApp richiede access token, phone number id e app secret per invio/firme reali",
    ),
    check(
      "OPENAI_LLM_BOOKING",
      process.env["ZAK_LLM_BOOKING_ENABLED"] !== "true"
        ? "warning"
        : process.env["OPENAI_API_KEY"] ? "ok" : "missing",
      process.env["ZAK_LLM_BOOKING_ENABLED"] === "true"
        ? "LLM Booking abilitato: OPENAI_API_KEY deve essere presente"
        : "LLM Booking disattivato: il fallback rule-based resta operativo",
    ),
    check(
      "GOOGLE_CALENDAR",
      process.env["ZAK_GOOGLE_CALENDAR_ENABLED"] !== "true"
        ? "warning"
        : hasAny("GOOGLE_CLIENT_ID") && hasAny("GOOGLE_CLIENT_SECRET") && hasAny("GOOGLE_REFRESH_TOKEN") ? "ok" : "missing",
      "Google Calendar richiede ZAK_GOOGLE_CALENDAR_ENABLED=true, client id/secret e refresh token",
    ),
    check(
      "VOICE_WEBHOOK_SECRET",
      hasAny("VOICE_WEBHOOK_SECRET", "VAPI_WEBHOOK_SECRET", "BLAND_WEBHOOK_SECRET") ? "ok" : "warning",
      "Consigliato proteggere il webhook voice con un secret provider",
    ),
    check(
      "NODE_ENV",
      process.env["NODE_ENV"] === "production" ? "ok" : "warning",
      process.env["NODE_ENV"] === "production" ? "Runtime produzione attivo" : "NODE_ENV non e production",
    ),
  ];

  res.json({
    ready: checks.every((item) => item.status !== "missing"),
    checks,
  });
});

export default router;
