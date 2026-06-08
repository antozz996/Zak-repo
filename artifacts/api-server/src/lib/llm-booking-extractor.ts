export type BookingLlmConfidence = "alto" | "medio" | "basso";

export type BookingLlmExtraction = {
  nome?: string;
  tipo_evento?: string;
  data_evento_richiesta?: string;
  numero_invitati?: number;
  budget_stimato?: number;
  preferenze: string[];
  handoff_richiesto: boolean;
  livello_confidenza: BookingLlmConfidence;
  dati_mancanti: string[];
};

type OpenAIResponseContent = {
  type?: string;
  text?: string;
  refusal?: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: OpenAIResponseContent[];
  }>;
};

const eventTypes = ["diciottesimo", "laurea", "compleanno", "matrimonio", "aziendale"] as const;
const confidenceValues = ["alto", "medio", "basso"] as const;

const bookingExtractionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "nome",
    "tipo_evento",
    "data_evento_richiesta",
    "numero_invitati",
    "budget_stimato",
    "preferenze",
    "handoff_richiesto",
    "livello_confidenza",
    "dati_mancanti",
  ],
  properties: {
    nome: { type: ["string", "null"] },
    tipo_evento: { type: ["string", "null"], enum: [...eventTypes, "altro", "sconosciuto", null] },
    data_evento_richiesta: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    numero_invitati: { type: ["integer", "null"], minimum: 1, maximum: 5000 },
    budget_stimato: { type: ["number", "null"], minimum: 0 },
    preferenze: { type: "array", items: { type: "string" } },
    handoff_richiesto: { type: "boolean" },
    livello_confidenza: { type: "string", enum: confidenceValues },
    dati_mancanti: { type: "array", items: { type: "string" } },
  },
};

function isEnabled() {
  return process.env["ZAK_LLM_BOOKING_ENABLED"] === "true";
}

function getOpenAIConfig() {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!isEnabled() || !apiKey) return null;
  return {
    apiKey,
    model: process.env["ZAK_LLM_BOOKING_MODEL"] || "gpt-5.4-nano",
    baseUrl: (process.env["OPENAI_BASE_URL"] || "https://api.openai.com/v1").replace(/\/$/, ""),
    timeoutMs: Number.parseInt(process.env["ZAK_LLM_BOOKING_TIMEOUT_MS"] || "12000", 10),
  };
}

function todayInRome() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}

function buildPrompt(input: { testo: string; contesto?: Record<string, unknown> }) {
  return [
    "Sei l'assistente di prenotazione di ZAK, un CRM per eventi in Italia.",
    "Estrai solo dati dichiarati o chiaramente deducibili dal messaggio cliente.",
    `Data corrente Europe/Rome: ${todayInRome()}. Usa questa data per convertire date relative.`,
    "Non inventare nome, data, invitati o budget. Usa null quando il dato manca.",
    "Imposta handoff_richiesto=true se il cliente chiede un umano, una chiamata, negoziazione, sconto, reclamo o tono frustrato.",
    "Usa tipo_evento solo tra diciottesimo, laurea, compleanno, matrimonio, aziendale; altrimenti altro o sconosciuto.",
    `Contesto CRM attuale JSON: ${JSON.stringify(input.contesto ?? {})}`,
    `Messaggio cliente: ${input.testo}`,
  ].join("\n");
}

function extractResponseText(response: OpenAIResponse): string | null {
  if (response.output_text) return response.output_text;
  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.refusal) return null;
      if (content.text) return content.text;
    }
  }
  return null;
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseIsoDate(value: unknown): string | undefined {
  const text = cleanString(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : text;
}

function parsePositiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}

export function normalizeBookingLlmExtraction(value: unknown): BookingLlmExtraction | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const rawTipo = cleanString(record["tipo_evento"]);
  const tipoEvento = rawTipo && (eventTypes as readonly string[]).includes(rawTipo) ? rawTipo : undefined;
  const rawConfidence = cleanString(record["livello_confidenza"]);
  const confidence = rawConfidence && (confidenceValues as readonly string[]).includes(rawConfidence)
    ? rawConfidence as BookingLlmConfidence
    : "basso";

  const preferences = Array.isArray(record["preferenze"])
    ? record["preferenze"].map(cleanString).filter((item): item is string => Boolean(item))
    : [];
  const missing = Array.isArray(record["dati_mancanti"])
    ? record["dati_mancanti"].map(cleanString).filter((item): item is string => Boolean(item))
    : [];

  return {
    nome: cleanString(record["nome"]),
    tipo_evento: tipoEvento,
    data_evento_richiesta: parseIsoDate(record["data_evento_richiesta"]),
    numero_invitati: parsePositiveNumber(record["numero_invitati"]),
    budget_stimato: parsePositiveNumber(record["budget_stimato"]),
    preferenze: preferences,
    handoff_richiesto: record["handoff_richiesto"] === true,
    livello_confidenza: confidence,
    dati_mancanti: missing,
  };
}

export async function extractBookingDataWithLlm(input: {
  testo: string;
  contesto?: Record<string, unknown>;
}): Promise<BookingLlmExtraction | null> {
  const config = getOpenAIConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(config.timeoutMs) ? config.timeoutMs : 12000);

  try {
    const response = await fetch(`${config.baseUrl}/responses`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: buildPrompt(input),
        text: {
          format: {
            type: "json_schema",
            name: "zak_booking_extraction",
            strict: true,
            schema: bookingExtractionSchema,
          },
        },
      }),
    });

    if (!response.ok) return null;
    const payload = await response.json() as OpenAIResponse;
    const text = extractResponseText(payload);
    if (!text) return null;
    return normalizeBookingLlmExtraction(JSON.parse(text));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
