import { and, desc, eq } from "drizzle-orm";
import { db, messaggiTable } from "@workspace/db";

const WHATSAPP_CONVERSATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function getWhatsAppConversationWindow(contattoId: string) {
  const [latestInbound] = await db
    .select()
    .from(messaggiTable)
    .where(and(
      eq(messaggiTable.contatto_id, contattoId),
      eq(messaggiTable.canale, "whatsapp"),
      eq(messaggiTable.direzione, "inbound"),
    ))
    .orderBy(desc(messaggiTable.timestamp))
    .limit(1);

  if (!latestInbound) {
    return {
      isOpen: false,
      lastInboundAt: null,
      expiresAt: null,
    };
  }

  const lastInboundAt = latestInbound.timestamp;
  const expiresAt = new Date(lastInboundAt.getTime() + WHATSAPP_CONVERSATION_WINDOW_MS);

  return {
    isOpen: expiresAt.getTime() > Date.now(),
    lastInboundAt,
    expiresAt,
  };
}
