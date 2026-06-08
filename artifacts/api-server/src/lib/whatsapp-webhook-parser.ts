import crypto from "node:crypto";

export type InboundMessageContent = {
  text: string;
  media: {
    media_id: string | null;
    media_tipo: string;
    media_mime_type: string | null;
    media_sha256: string | null;
    media_filename: string | null;
  } | null;
};

export function isMetaSignatureValid(signatureHeader: string | undefined, rawBody: Buffer | undefined, appSecret: string | undefined) {
  if (!appSecret) {
    return true;
  }

  if (!signatureHeader || !rawBody) {
    return false;
  }

  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const providedBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export function extractInboundMessageContent(msg: Record<string, any>): InboundMessageContent {
  const type = msg.type;

  if (type === "text") {
    return {
      text: msg.text?.body || "",
      media: null,
    };
  }

  const media = ["image", "video", "audio", "document", "sticker"].includes(type) ? msg[type] : null;

  if (!media) {
    return {
      text: `[${type || "messaggio"}]`,
      media: null,
    };
  }

  const filename = media.filename || null;
  const caption = media.caption ? ` - ${media.caption}` : "";

  return {
    text: `[${type}${filename ? `: ${filename}` : ""}]${caption}`,
    media: {
      media_id: media.id || null,
      media_tipo: type,
      media_mime_type: media.mime_type || null,
      media_sha256: media.sha256 || null,
      media_filename: filename,
    },
  };
}

export function normalizePhoneForLookup(phone?: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

export function extractWhatsAppInboundMessages(payload: Record<string, any>) {
  const result: Array<{
    phone: string;
    contactName: string | null;
    content: InboundMessageContent;
  }> = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const contactName = change.value?.contacts?.[0]?.profile?.name ?? null;
      for (const msg of change.value?.messages || []) {
        result.push({
          phone: msg.from,
          contactName,
          content: extractInboundMessageContent(msg),
        });
      }
    }
  }

  return result;
}

export function extractWhatsAppStatuses(payload: Record<string, any>) {
  const result: Array<{
    providerMessageId: string;
    status: string;
    timestamp: string | null;
    recipientId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  }> = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const statusEvent of change.value?.statuses || []) {
        const firstError = Array.isArray(statusEvent.errors) ? statusEvent.errors[0] : undefined;
        result.push({
          providerMessageId: statusEvent.id,
          status: statusEvent.status,
          timestamp: statusEvent.timestamp ?? null,
          recipientId: statusEvent.recipient_id ?? null,
          errorCode: firstError?.code ? String(firstError.code) : null,
          errorMessage: firstError?.message || firstError?.title || null,
        });
      }
    }
  }

  return result;
}

