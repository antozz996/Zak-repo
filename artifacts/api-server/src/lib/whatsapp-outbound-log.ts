import { db, whatsappOutboundLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { SendWhatsAppTextResult } from "./whatsapp";

function excerpt(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
}

export async function logWhatsAppOutbound(input: {
  contattoId?: string | null;
  telefono: string;
  sorgente: string;
  testo: string;
  result: SendWhatsAppTextResult;
}) {
  await db.insert(whatsappOutboundLogTable).values({
    contatto_id: input.contattoId ?? null,
    telefono: input.telefono,
    sorgente: input.sorgente,
    stato: input.result.status,
    provider_message_id: input.result.status === "sent" ? input.result.providerMessageId ?? null : null,
    errore: input.result.status === "sent" ? null : input.result.reason,
    messaggio_excerpt: excerpt(input.testo),
  });
}

export async function updateWhatsAppDeliveryStatus(input: {
  providerMessageId: string;
  status: string;
  timestamp?: string | number | null;
  recipientId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  const deliveryUpdatedAt = input.timestamp
    ? new Date(Number(input.timestamp) * 1000)
    : new Date();
  const validDeliveryDate = Number.isNaN(deliveryUpdatedAt.getTime()) ? new Date() : deliveryUpdatedAt;

  const [updated] = await db
    .update(whatsappOutboundLogTable)
    .set({
      delivery_status: input.status,
      delivery_updated_at: validDeliveryDate,
      provider_error_code: input.errorCode ?? null,
      provider_error_message: input.errorMessage ?? null,
      errore: input.status === "failed" ? input.errorMessage ?? input.errorCode ?? "WhatsApp delivery failed" : null,
    })
    .where(eq(whatsappOutboundLogTable.provider_message_id, input.providerMessageId))
    .returning();

  if (updated) {
    return;
  }

  await db.insert(whatsappOutboundLogTable).values({
    telefono: input.recipientId ?? "unknown",
    sorgente: "meta_status_webhook",
    stato: input.status === "failed" ? "failed" : "sent",
    provider_message_id: input.providerMessageId,
    delivery_status: input.status,
    delivery_updated_at: validDeliveryDate,
    provider_error_code: input.errorCode ?? null,
    provider_error_message: input.errorMessage ?? null,
    errore: input.status === "failed" ? input.errorMessage ?? input.errorCode ?? "WhatsApp delivery failed" : null,
    messaggio_excerpt: "Status ricevuto da Meta senza log outbound locale collegato",
  });
}
