import { logger } from "./logger";

type SendWhatsAppTextInput = {
  to: string;
  text: string;
};

type SendWhatsAppTextResult =
  | { status: "sent"; providerMessageId?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

function getWhatsAppConfig() {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.META_GRAPH_API_VERSION ?? "v20.0";

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return { accessToken, phoneNumberId, apiVersion };
}

function normalizePhoneNumber(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export async function sendWhatsAppText(input: SendWhatsAppTextInput): Promise<SendWhatsAppTextResult> {
  const config = getWhatsAppConfig();

  if (!config) {
    return { status: "skipped", reason: "Meta WhatsApp env vars not configured" };
  }

  const to = normalizePhoneNumber(input.to);
  if (!to) {
    return { status: "failed", reason: "Invalid recipient phone number" };
  }

  const response = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: input.text,
      },
    }),
  });

  const payload = await response.json().catch(() => null) as { messages?: Array<{ id?: string }>; error?: { message?: string } } | null;

  if (!response.ok) {
    const reason = payload?.error?.message ?? `Meta API returned ${response.status}`;
    logger.warn({ reason, status: response.status }, "WhatsApp outbound failed");
    return { status: "failed", reason };
  }

  return {
    status: "sent",
    providerMessageId: payload?.messages?.[0]?.id,
  };
}

export async function sendWhatsAppTextSafely(input: SendWhatsAppTextInput): Promise<SendWhatsAppTextResult> {
  try {
    const result = await sendWhatsAppText(input);

    if (result.status === "skipped") {
      logger.info({ reason: result.reason }, "WhatsApp outbound skipped");
    }

    return result;
  } catch (err) {
    logger.error({ err }, "WhatsApp outbound error");
    return { status: "failed", reason: "Unexpected WhatsApp outbound error" };
  }
}
