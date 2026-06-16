import {
  db,
  whatsappLogsTable,
  whatsappTemplatesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendWhatsAppTemplateSafely } from "./whatsapp";

type TemplateTriggerKey = "nuovo_lead" | "promemoria_pagamento" | "invio_preventivo";

const defaultTemplateMappings: Array<{
  trigger_key: TemplateTriggerKey;
  display_name: string;
  body_preview: string;
}> = [
  {
    trigger_key: "nuovo_lead",
    display_name: "Nuovo lead",
    body_preview: "Ciao {{1}}, grazie per aver contattato Zak. Ti risponderemo a breve con i dettagli per il tuo evento.",
  },
  {
    trigger_key: "promemoria_pagamento",
    display_name: "Promemoria pagamento",
    body_preview: "Ciao {{1}}, ti ricordiamo la rata {{2}} in scadenza per il tuo evento Zak. Importo: {{3}}.",
  },
  {
    trigger_key: "invio_preventivo",
    display_name: "Invio preventivo",
    body_preview: "Ciao {{1}}, il tuo preventivo Zak e pronto. Aprilo qui: {{2}}",
  },
];

export async function ensureWhatsAppTemplateDefaults() {
  for (const template of defaultTemplateMappings) {
    await db.insert(whatsappTemplatesTable).values({
      ...template,
      status: "pending",
      language_code: "it",
    }).onConflictDoNothing();
  }
}

export async function listWhatsAppTemplates() {
  await ensureWhatsAppTemplateDefaults();
  return db.select().from(whatsappTemplatesTable).orderBy(whatsappTemplatesTable.display_name);
}

export async function getWhatsAppTemplateByTrigger(triggerKey: TemplateTriggerKey) {
  await ensureWhatsAppTemplateDefaults();
  const [row] = await db
    .select()
    .from(whatsappTemplatesTable)
    .where(eq(whatsappTemplatesTable.trigger_key, triggerKey));
  return row ?? null;
}

export async function dispatchWhatsAppTriggerTemplate(input: {
  triggerKey: TemplateTriggerKey;
  to: string;
  variables: string[];
  contattoId?: string | null;
  eventId?: string | null;
}) {
  const template = await getWhatsAppTemplateByTrigger(input.triggerKey);

  if (!template || template.status !== "approved" || !template.template_name) {
    const [log] = await db.insert(whatsappLogsTable).values({
      template_id: template?.id ?? null,
      template_name: template?.template_name ?? null,
      trigger_key: input.triggerKey,
      destinatario: input.to,
      contatto_id: input.contattoId ?? null,
      event_id: input.eventId ?? null,
      stato_invio: "skipped",
      errore: template
        ? "Template non approvato o non configurato"
        : "Mappatura template assente",
      payload_json: JSON.stringify({ variables: input.variables }),
    }).returning();
    return { status: "skipped" as const, reason: log.errore ?? "Template non configurato" };
  }

  const result = await sendWhatsAppTemplateSafely({
    to: input.to,
    templateName: template.template_name,
    languageCode: template.language_code || "it",
    bodyParameters: input.variables.map((text) => ({ type: "text" as const, text })),
  });

  await db.insert(whatsappLogsTable).values({
    template_id: template.id,
    template_name: template.template_name,
    trigger_key: input.triggerKey,
    destinatario: input.to,
    contatto_id: input.contattoId ?? null,
    event_id: input.eventId ?? null,
    stato_invio: result.status,
    provider_message_id: result.status === "sent" ? result.providerMessageId ?? null : null,
    errore: result.status === "failed" || result.status === "skipped" ? result.reason : null,
    payload_json: JSON.stringify({ variables: input.variables }),
  });

  return result;
}
