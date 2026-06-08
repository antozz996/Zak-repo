import { Router } from "express";
import { db, contattiCrmTable, messaggiTable, agendaPersonaleTable, taskPersonaliTable, preventiviEventiTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { processBookingAssistantMessage } from "../lib/booking-assistant";
import { logLeadStatusChange } from "../lib/lead-status-history";
import { updateWhatsAppDeliveryStatus } from "../lib/whatsapp-outbound-log";
import { publishChatEvent } from "../lib/chat-events";
import {
  buildAgendaTitle,
  buildTaskTitle,
  extractVoicePriority,
  parseVoiceIntent,
} from "../lib/voice-assistant-parser";
import {
  extractInboundMessageContent,
  isMetaSignatureValid,
  normalizePhoneForLookup,
} from "../lib/whatsapp-webhook-parser";
import {
  isVoiceWebhookAuthorized,
  parseVoiceProviderPayload,
  type NormalizedVoiceCall,
} from "../lib/voice-provider-parser";
import { syncAgendaItemToGoogle, syncGoogleCalendar } from "../lib/google-calendar";

const router = Router();

async function findContattoByTelefono(telefono?: string | null) {
  const normalized = normalizePhoneForLookup(telefono);
  if (!normalized) return null;

  const contatti = await db.select().from(contattiCrmTable);

  return contatti.find((contatto) => normalizePhoneForLookup(contatto.telefono) === normalized) ?? null;
}

async function getOrCreateVoiceContatto(call: NormalizedVoiceCall) {
  const existing = await findContattoByTelefono(call.telefono);
  if (existing) {
    const update: Partial<typeof contattiCrmTable.$inferInsert> = { ultimo_contatto: new Date() };
    if ((existing.nome === "Sconosciuto" || existing.nome === "Cliente Voice") && call.customerName) {
      update.nome = call.customerName;
    }
    if (!existing.tipo_evento && call.eventType) {
      update.tipo_evento = call.eventType;
    }
    if (Object.keys(update).length > 0) {
      const [updated] = await db.update(contattiCrmTable).set(update).where(eq(contattiCrmTable.id, existing.id)).returning();
      return updated ?? existing;
    }
    return existing;
  }

  if (!call.telefono) return null;
  const [created] = await db.insert(contattiCrmTable).values({
    nome: call.customerName || "Cliente Voice",
    telefono: call.telefono,
    origine_lead: "voice",
    tipo_evento: call.eventType,
    stato_lead: "entrata",
    note_interna: [
      `Creato da webhook voice ${call.provider}`,
      call.customerEmail ? `Email rilevata: ${call.customerEmail}` : null,
      call.callId ? `Call ID: ${call.callId}` : null,
    ].filter(Boolean).join("\n"),
  }).returning();
  await logLeadStatusChange({
    contattoId: created.id,
    previousStatus: null,
    nextStatus: created.stato_lead,
    origine: "voice_webhook",
    nota: `Nuovo lead creato da webhook ${call.provider}`,
  });
  return created;
}

async function updatePreventivoFromVoice(call: NormalizedVoiceCall, contattoId?: string | null) {
  if (!contattoId || (!call.eventDate && !call.guestCount)) return;
  const [existing] = await db
    .select()
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.contatto_id, contattoId), eq(preventiviEventiTable.stato_evento, "opzionato")))
    .orderBy(desc(preventiviEventiTable.data_creazione))
    .limit(1);
  const note = [
    existing?.note ?? "Creato/aggiornato da webhook voice assistant",
    call.summary ? `Riepilogo voice: ${call.summary}` : null,
    call.customerEmail ? `Email: ${call.customerEmail}` : null,
    call.callId ? `Call ID ${call.provider}: ${call.callId}` : null,
  ].filter(Boolean).join("\n");
  const values: typeof preventiviEventiTable.$inferInsert = {
    contatto_id: contattoId,
    stato_evento: "opzionato",
    note,
  };
  if (call.eventDate) values.data_evento_richiesta = call.eventDate;
  if (call.guestCount) values.numero_invitati = call.guestCount;
  if (existing) {
    const update: Partial<typeof preventiviEventiTable.$inferInsert> = { note };
    if (!existing.data_evento_richiesta && call.eventDate) update.data_evento_richiesta = call.eventDate;
    if (!existing.numero_invitati && call.guestCount) update.numero_invitati = call.guestCount;
    await db.update(preventiviEventiTable).set(update).where(eq(preventiviEventiTable.id, existing.id));
  } else {
    await db.insert(preventiviEventiTable).values(values);
  }
}

function buildVoiceDescription(call: NormalizedVoiceCall, intent: { type: string; confidence: string }, contattoNome?: string) {
  return [
    `Provider: ${call.provider}`,
    call.callId ? `Call ID: ${call.callId}` : null,
    `Intento rilevato: ${intent.type} (${intent.confidence})`,
    call.summary ? `Riepilogo: ${call.summary}` : null,
    call.recordingUrl ? `Registrazione: ${call.recordingUrl}` : null,
    contattoNome ? `Contatto CRM collegato: ${contattoNome}` : null,
    `Trascrizione: ${call.trascrizione}`,
  ].filter(Boolean).join("\n");
}

router.get("/webhook/whatsapp", async (req, res) => {
  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const expectedToken = process.env["META_WEBHOOK_VERIFY_TOKEN"];

  if (mode === "subscribe" && verifyToken && expectedToken && verifyToken === expectedToken && typeof challenge === "string") {
    res.type("text/plain").send(challenge);
    return;
  }

  res.status(403).send("Forbidden");
});

router.post("/webhook/whatsapp", async (req, res) => {
  try {
    const signatureHeader = req.header("x-hub-signature-256");
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    const appSecret = process.env["META_APP_SECRET"];

    if (!isMetaSignatureValid(signatureHeader, rawBody, appSecret)) {
      res.status(401).json({ success: false, message: "Invalid webhook signature" });
      return;
    }

    const payload = req.body;
    const entries = payload.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const statuses = change.value?.statuses || [];
        for (const statusEvent of statuses) {
          const firstError = Array.isArray(statusEvent.errors) ? statusEvent.errors[0] : undefined;
          await updateWhatsAppDeliveryStatus({
            providerMessageId: statusEvent.id,
            status: statusEvent.status,
            timestamp: statusEvent.timestamp,
            recipientId: statusEvent.recipient_id,
            errorCode: firstError?.code ? String(firstError.code) : null,
            errorMessage: firstError?.message || firstError?.title || null,
          });
        }

        const messages = change.value?.messages || [];
        for (const msg of messages) {
          const phone = msg.from;
          const content = extractInboundMessageContent(msg);

          let [contatto] = await db.select().from(contattiCrmTable).where(eq(contattiCrmTable.telefono, phone));
          if (!contatto) {
            const [newContatto] = await db.insert(contattiCrmTable).values({
              nome: change.value?.contacts?.[0]?.profile?.name || "Sconosciuto",
              telefono: phone,
              origine_lead: "whatsapp",
              stato_lead: "entrata",
            }).returning();
            await logLeadStatusChange({
              contattoId: newContatto.id,
              previousStatus: null,
              nextStatus: newContatto.stato_lead,
              origine: "whatsapp_webhook",
              nota: "Nuovo lead creato da messaggio inbound",
            });
            contatto = newContatto;
          }

          const [inboundMessage] = await db.insert(messaggiTable).values({
            contatto_id: contatto.id,
            canale: "whatsapp",
            direzione: "inbound",
            testo: content.text,
            ...(content.media ?? {}),
            mittente_nome: contatto.nome,
          }).returning();
          publishChatEvent("message_created", {
            messaggio_id: inboundMessage.id,
            contatto_id: inboundMessage.contatto_id,
            canale: inboundMessage.canale,
            direzione: inboundMessage.direzione,
          });

          if (!contatto.operatore_assegnato_id && !contatto.handoff_richiesto) {
            await processBookingAssistantMessage({
              contatto,
              testo: content.text,
            });
          } else {
            await db
              .update(contattiCrmTable)
              .set({ ultimo_contatto: new Date() })
              .where(eq(contattiCrmTable.id, contatto.id));
          }
        }
      }
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error processing webhook" });
  }
});

router.post("/webhook/voice-assistant", async (req, res) => {
  try {
    const voiceCall = parseVoiceProviderPayload(req.body);
    if (!voiceCall) {
      res.status(400).json({ success: false, message: "Invalid voice webhook payload" });
      return;
    }

    if (!isVoiceWebhookAuthorized({
      provider: voiceCall.provider,
      authorization: req.header("authorization") ?? undefined,
      webhookSecret: req.header("x-webhook-secret")
        ?? req.header("x-vapi-secret")
        ?? req.header("x-bland-webhook-secret")
        ?? undefined,
    })) {
      res.status(401).json({ success: false, message: "Invalid voice webhook secret" });
      return;
    }

    const contatto = await getOrCreateVoiceContatto(voiceCall);
    await updatePreventivoFromVoice(voiceCall, contatto?.id);
    const voiceIntent = parseVoiceIntent(voiceCall.trascrizione);
    const isTask = voiceIntent.type === "task";

    const titolo = `Chiamata ${voiceCall.provider}${contatto ? ` da ${contatto.nome}` : voiceCall.telefono ? ` da ${voiceCall.telefono}` : ""}`;
    const now = new Date();
    const providerDate = voiceCall.eventDate ? new Date(`${voiceCall.eventDate}T10:00:00`) : null;
    const inizio = voiceIntent.type === "agenda" && (voiceIntent.dateTime.date || providerDate)
      ? voiceIntent.dateTime.date ?? providerDate ?? now
      : now;
    const fine = new Date(inizio.getTime() + (voiceCall.durata || 5) * 60 * 1000);
    const descrizione = buildVoiceDescription(voiceCall, voiceIntent, contatto?.nome);

    if (isTask) {
      await db.insert(taskPersonaliTable).values({
        titolo: buildTaskTitle(voiceCall.summary || voiceCall.trascrizione),
        descrizione,
        stato: "aperto",
        priorita: extractVoicePriority(voiceCall.trascrizione),
        scadenza: voiceIntent.dateTime.date,
        fonte: "voice",
        contatto_id: contatto?.id ?? null,
      });
    } else {
      const [agendaItem] = await db.insert(agendaPersonaleTable).values({
        titolo: voiceIntent.confidence === "bassa" ? titolo : buildAgendaTitle(voiceCall.summary || voiceCall.trascrizione, contatto),
        descrizione,
        data_ora_inizio: inizio,
        data_ora_fine: fine,
        categoria: "lavoro",
        contatto_id: contatto?.id ?? null,
      }).returning();
      await syncAgendaItemToGoogle(agendaItem);
    }

    if (contatto) {
      const [voiceMessage] = await db.insert(messaggiTable).values({
        contatto_id: contatto.id,
        canale: "voice",
        direzione: "inbound",
        testo: [
          `Trascrizione chiamata ${voiceCall.provider}: ${voiceCall.trascrizione}`,
          voiceCall.summary ? `Riepilogo: ${voiceCall.summary}` : null,
          voiceCall.recordingUrl ? `Registrazione: ${voiceCall.recordingUrl}` : null,
        ].filter(Boolean).join("\n"),
        mittente_nome: contatto.nome,
      }).returning();
      publishChatEvent("message_created", {
        messaggio_id: voiceMessage.id,
        contatto_id: voiceMessage.contatto_id,
        canale: voiceMessage.canale,
        direzione: voiceMessage.direzione,
      });
      await db
        .update(contattiCrmTable)
        .set({ ultimo_contatto: now })
        .where(eq(contattiCrmTable.id, contatto.id));
    }

    res.json({
      success: true,
      message: isTask
        ? contatto ? `Task creato da ${voiceCall.provider} e collegato a ${contatto.nome}` : `Task creato da ${voiceCall.provider}`
        : contatto ? `Chiamata ${voiceCall.provider} registrata in agenda e collegata a ${contatto.nome}` : `Chiamata ${voiceCall.provider} registrata in agenda`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error processing voice webhook" });
  }
});

router.post("/webhook/google-calendar", async (req, res) => {
  const expectedToken = process.env["GOOGLE_CHANNEL_TOKEN"];
  const receivedToken = req.header("x-goog-channel-token");
  if (expectedToken && receivedToken !== expectedToken) {
    res.status(401).json({ success: false, message: "Invalid Google Calendar channel token" });
    return;
  }

  const result = await syncGoogleCalendar({
    direction: "google_to_zak",
    fullSync: false,
  });

  res.json({
    success: result.errors.length === 0,
    message: result.message,
  });
});

export default router;
