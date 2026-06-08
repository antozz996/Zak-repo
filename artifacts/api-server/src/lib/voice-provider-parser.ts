export type VoiceProvider = "generic" | "vapi" | "bland";

export type NormalizedVoiceCall = {
  provider: VoiceProvider;
  callId?: string;
  telefono?: string;
  trascrizione: string;
  summary?: string;
  durata?: number;
  recordingUrl?: string;
  customerName?: string;
  customerEmail?: string;
  eventDate?: string;
  guestCount?: number;
  eventType?: string;
  intent?: string;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return undefined;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readNestedString(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record;
  for (const key of path) {
    current = readObject(current)[key];
  }
  return readString(current);
}

function joinTranscript(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  const parts = value
    .map((item) => {
      const row = readObject(item);
      const speaker = readString(row["speaker"]) || readString(row["role"]);
      const text = readString(row["text"]) || readString(row["message"]) || readString(row["content"]);
      return text ? `${speaker ? `${speaker}: ` : ""}${text}` : null;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join("\n") : undefined;
}

function normalizeIsoDate(value: unknown) {
  const text = readString(value);
  if (!text) return undefined;
  const dateOnly = text.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return dateOnly;
}

function inferProvider(payload: Record<string, unknown>): VoiceProvider {
  const explicit = readString(payload["provider"])?.toLowerCase();
  if (explicit === "vapi" || readNestedString(payload, ["message", "type"])) return "vapi";
  if (explicit === "bland" || readString(payload["call_id"]) || readString(payload["callId"])) return "bland";
  return "generic";
}

export function parseVoiceProviderPayload(payload: unknown): NormalizedVoiceCall | null {
  const root = readObject(payload);
  const provider = inferProvider(root);

  if (provider === "vapi") {
    const message = readObject(root["message"]);
    const call = readObject(message["call"]);
    const analysis = readObject(call["analysis"]);
    const parameters = readObject(analysis["parameters"]);
    const transcript = readString(call["transcript"]) || readString(root["trascrizione"]);
    if (!transcript) return null;
    return {
      provider,
      callId: readString(call["id"]),
      telefono: readNestedString(call, ["customer", "number"]) || readString(root["telefono"]),
      trascrizione: transcript,
      summary: readString(call["summary"]) || readString(root["summary"]),
      durata: readNumber(call["durationSeconds"]) ? Math.max(1, Math.ceil((readNumber(call["durationSeconds"]) ?? 0) / 60)) : readNumber(root["durata"]),
      recordingUrl: readString(call["recordingUrl"]) || readString(root["recording_url"]),
      customerName: readString(parameters["customer_name"]) || readString(parameters["name"]),
      customerEmail: readString(parameters["customer_email"]) || readString(parameters["email"]),
      eventDate: normalizeIsoDate(parameters["event_date"]),
      guestCount: readNumber(parameters["guest_count"]) || readNumber(parameters["numero_invitati"]),
      eventType: readString(parameters["event_type"]) || readString(analysis["intent"]),
      intent: readString(analysis["intent"]),
    };
  }

  if (provider === "bland") {
    const data = readObject(root["data"]);
    const variables = {
      ...readObject(root["variables"]),
      ...readObject(root["extracted_variables"]),
      ...readObject(data["variables"]),
      ...readObject(data["extracted_variables"]),
    };
    const transcript = readString(root["concatenated_transcript"])
      || readString(root["transcript"])
      || readString(data["transcript"])
      || joinTranscript(root["transcripts"])
      || joinTranscript(data["transcripts"]);
    if (!transcript) return null;
    return {
      provider,
      callId: readString(root["call_id"]) || readString(root["callId"]) || readString(data["call_id"]),
      telefono: readString(root["from"]) || readString(root["to"]) || readString(data["from"]) || readString(data["to"]),
      trascrizione: transcript,
      summary: readString(root["summary"]) || readString(data["summary"]),
      durata: readNumber(root["call_length"]) || readNumber(data["call_length"]),
      recordingUrl: readString(root["recording_url"]) || readString(root["recordingUrl"]) || readString(data["recording_url"]),
      customerName: readString(variables["customer_name"]) || readString(variables["nome"]),
      customerEmail: readString(variables["customer_email"]) || readString(variables["email"]),
      eventDate: normalizeIsoDate(variables["event_date"]) || normalizeIsoDate(variables["data_evento"]),
      guestCount: readNumber(variables["guest_count"]) || readNumber(variables["numero_invitati"]),
      eventType: readString(variables["event_type"]) || readString(variables["tipo_evento"]),
      intent: readString(root["intent"]) || readString(data["intent"]),
    };
  }

  const transcript = readString(root["trascrizione"]) || readString(root["transcript"]);
  if (!transcript) return null;
  return {
    provider,
    callId: readString(root["call_id"]) || readString(root["callId"]),
    telefono: readString(root["telefono"]) || readString(root["phone"]) || readString(root["phone_number"]),
    trascrizione: transcript,
    summary: readString(root["summary"]),
    durata: readNumber(root["durata"]) || readNumber(root["durationSeconds"]),
    recordingUrl: readString(root["recording_url"]) || readString(root["recordingUrl"]),
    customerName: readString(root["customer_name"]),
    customerEmail: readString(root["customer_email"]),
    eventDate: normalizeIsoDate(root["event_date"]),
    guestCount: readNumber(root["guest_count"]) || readNumber(root["numero_invitati"]),
    eventType: readString(root["event_type"]) || readString(root["tipo_evento"]),
    intent: readString(root["intent"]),
  };
}

export function getExpectedVoiceWebhookSecrets(provider: VoiceProvider) {
  return [
    process.env["VOICE_WEBHOOK_SECRET"],
    provider === "vapi" ? process.env["VAPI_WEBHOOK_SECRET"] : undefined,
    provider === "bland" ? process.env["BLAND_WEBHOOK_SECRET"] : undefined,
  ].filter((value): value is string => Boolean(value));
}

export function isVoiceWebhookAuthorized(params: {
  provider: VoiceProvider;
  authorization?: string;
  webhookSecret?: string;
}) {
  const expectedSecrets = getExpectedVoiceWebhookSecrets(params.provider);
  if (expectedSecrets.length === 0) return true;
  const bearer = params.authorization?.startsWith("Bearer ") ? params.authorization.slice("Bearer ".length).trim() : null;
  return expectedSecrets.some((secret) => secret === params.webhookSecret || secret === bearer || secret === params.authorization);
}
