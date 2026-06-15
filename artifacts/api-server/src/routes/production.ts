import { Router } from "express";

const router = Router();

type ReadinessStatus = "ok" | "warning" | "missing";

function missingKeys(...keys: string[]) {
  return keys.filter((key) => !process.env[key]);
}

function hasAny(...keys: string[]) {
  return keys.some((key) => Boolean(process.env[key]));
}

function hasAll(...keys: string[]) {
  return missingKeys(...keys).length === 0;
}

function check(input: {
  key: string;
  status: ReadinessStatus;
  message: string;
  requiredEnv?: string[];
  optionalEnv?: string[];
  action?: string;
}) {
  const requiredEnv = input.requiredEnv ?? [];
  return {
    key: input.key,
    status: input.status,
    message: input.message,
    required_env: requiredEnv,
    configured_env: requiredEnv.filter((key) => Boolean(process.env[key])),
    optional_env: input.optionalEnv ?? [],
    action: input.action,
  };
}

router.get("/production/readiness", (_req, res) => {
  const metaRequired = ["META_WHATSAPP_ACCESS_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID", "META_APP_SECRET"];
  const googleRequired = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"];
  const llmRequired = ["OPENAI_API_KEY"];
  const voiceProviderRequired = ["VAPI_WEBHOOK_SECRET", "BLAND_WEBHOOK_SECRET"];
  const authRequired = process.env["ZAK_AUTH_SECRET"]
    ? ["ZAK_AUTH_SECRET"]
    : process.env["SESSION_SECRET"] ? ["SESSION_SECRET"] : ["ZAK_AUTH_SECRET"];
  const voiceConfigured = ["VOICE_WEBHOOK_SECRET", ...voiceProviderRequired].filter((key) => Boolean(process.env[key]));
  const voiceRequired = voiceConfigured.length > 0 ? voiceConfigured : ["VOICE_WEBHOOK_SECRET"];

  const checks = [
    check({
      key: "DATABASE_URL",
      status: process.env["DATABASE_URL"] ? "ok" : "missing",
      message: process.env["DATABASE_URL"] ? "Database configurato" : "DATABASE_URL mancante: il backend non puo usare PostgreSQL reale",
      requiredEnv: ["DATABASE_URL"],
      action: "Configura il database PostgreSQL Neon o equivalente.",
    }),
    check({
      key: "PORT",
      status: process.env["PORT"] ? "ok" : "warning",
      message: process.env["PORT"] ? "Porta backend configurata" : "PORT non configurata: in produzione va impostata dall'host",
      requiredEnv: ["PORT"],
      action: "Su Render la porta viene normalmente iniettata dall'host.",
    }),
    check({
      key: "ZAK_AUTH_SECRET",
      status: hasAny("ZAK_AUTH_SECRET", "SESSION_SECRET") ? "ok" : "missing",
      message: hasAny("ZAK_AUTH_SECRET", "SESSION_SECRET") ? "Segreto sessione staff configurato" : "Manca ZAK_AUTH_SECRET o SESSION_SECRET",
      requiredEnv: authRequired,
      optionalEnv: ["SESSION_SECRET"],
      action: "Imposta un segreto lungo e casuale per firmare le sessioni staff.",
    }),
    check({
      key: "ZAK_BOOTSTRAP_ADMIN_TOKEN",
      status: process.env["ZAK_BOOTSTRAP_ADMIN_TOKEN"] ? "ok" : "warning",
      message: process.env["ZAK_BOOTSTRAP_ADMIN_TOKEN"] ? "Bootstrap admin protetto" : "Consigliato configurare ZAK_BOOTSTRAP_ADMIN_TOKEN prima del go-live",
      requiredEnv: ["ZAK_BOOTSTRAP_ADMIN_TOKEN"],
      action: "Usa un token lungo per proteggere la creazione/reset del primo admin.",
    }),
    check({
      key: "META_WHATSAPP",
      status: hasAll(...metaRequired) ? "ok" : "warning",
      message: hasAll(...metaRequired)
        ? "Meta WhatsApp pronto per invio/firme reali"
        : "Meta WhatsApp richiede access token, phone number id e app secret per invio/firme reali",
      requiredEnv: metaRequired,
      optionalEnv: [
        "META_WEBHOOK_VERIFY_TOKEN",
        "META_GRAPH_API_VERSION",
        "META_WHATSAPP_TEMPLATE_LANGUAGE",
        "META_WHATSAPP_REENGAGEMENT_TEMPLATE_NAME",
        "META_WHATSAPP_RICORRENZA_TEMPLATE_NAME",
      ],
      action: "Inserisci le credenziali Meta Cloud API e configura il webhook WhatsApp su /api/webhook/whatsapp.",
    }),
    check({
      key: "OPENAI_LLM_BOOKING",
      status: process.env["ZAK_LLM_BOOKING_ENABLED"] !== "true"
        ? "warning"
        : hasAll(...llmRequired) ? "ok" : "missing",
      message: process.env["ZAK_LLM_BOOKING_ENABLED"] === "true"
        ? "LLM Booking abilitato: OPENAI_API_KEY deve essere presente"
        : "LLM Booking disattivato: il fallback rule-based resta operativo",
      requiredEnv: process.env["ZAK_LLM_BOOKING_ENABLED"] === "true" ? llmRequired : ["ZAK_LLM_BOOKING_ENABLED", ...llmRequired],
      optionalEnv: ["OPENAI_BASE_URL", "ZAK_LLM_BOOKING_MODEL", "ZAK_LLM_BOOKING_TIMEOUT_MS"],
      action: "Abilita ZAK_LLM_BOOKING_ENABLED=true e inserisci una chiave OpenAI o provider compatibile.",
    }),
    check({
      key: "GOOGLE_CALENDAR",
      status: process.env["ZAK_GOOGLE_CALENDAR_ENABLED"] !== "true"
        ? "warning"
        : hasAll(...googleRequired) ? "ok" : "missing",
      message: process.env["ZAK_GOOGLE_CALENDAR_ENABLED"] === "true"
        ? "Google Calendar abilitato: client id/secret e refresh token devono essere presenti"
        : "Google Calendar disattivato: il calendario interno resta operativo",
      requiredEnv: process.env["ZAK_GOOGLE_CALENDAR_ENABLED"] === "true" ? googleRequired : ["ZAK_GOOGLE_CALENDAR_ENABLED", ...googleRequired],
      optionalEnv: ["GOOGLE_CALENDAR_ID", "GOOGLE_CALENDAR_TIMEZONE", "GOOGLE_CHANNEL_TOKEN", "ZAK_GOOGLE_DELETE_CANCELLED"],
      action: "Crea OAuth client Google, genera refresh token e abilita ZAK_GOOGLE_CALENDAR_ENABLED=true.",
    }),
    check({
      key: "VOICE_WEBHOOK_SECRET",
      status: hasAny("VOICE_WEBHOOK_SECRET", "VAPI_WEBHOOK_SECRET", "BLAND_WEBHOOK_SECRET") ? "ok" : "warning",
      message: hasAny("VOICE_WEBHOOK_SECRET", "VAPI_WEBHOOK_SECRET", "BLAND_WEBHOOK_SECRET")
        ? "Webhook voice protetto da secret"
        : "Consigliato proteggere il webhook voice con un secret provider",
      requiredEnv: voiceRequired,
      optionalEnv: voiceProviderRequired,
      action: "Configura almeno VOICE_WEBHOOK_SECRET o il secret specifico del provider voice.",
    }),
    check({
      key: "NODE_ENV",
      status: process.env["NODE_ENV"] === "production" ? "ok" : "warning",
      message: process.env["NODE_ENV"] === "production" ? "Runtime produzione attivo" : "NODE_ENV non e production",
      requiredEnv: ["NODE_ENV"],
      action: "Imposta NODE_ENV=production nell'ambiente di deploy.",
    }),
  ];

  res.json({
    ready: checks.every((item) => item.status !== "missing"),
    checks,
  });
});

export default router;
