import assert from "node:assert/strict";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  extractWhatsAppInboundMessages,
  extractWhatsAppStatuses,
  isMetaSignatureValid,
  normalizePhoneForLookup,
} from "./whatsapp-webhook-parser";

type WhatsAppFixtures = Record<string, Record<string, any>>;

function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (current !== path.dirname(current)) {
    if (existsSync(path.join(current, "attached_assets"))) return current;
    current = path.dirname(current);
  }
  throw new Error(`Repo root non trovata partendo da ${startDir}`);
}

const fixturePath = path.join(findRepoRoot(process.cwd()), "attached_assets", "whatsapp-webhook-sample-payloads.json");
const fixtures = JSON.parse(await readFile(fixturePath, "utf8")) as WhatsAppFixtures;

const textMessages = extractWhatsAppInboundMessages(fixtures["inbound_text_message"]);
assert.equal(textMessages.length, 1, "payload testo: messaggio non estratto");
assert.equal(textMessages[0]?.phone, "393331234567", "payload testo: telefono non coerente");
assert.equal(textMessages[0]?.contactName, "Mario Rossi", "payload testo: nome contatto non coerente");
assert.equal(
  textMessages[0]?.content.text,
  "Salve, vorrei ricevere informazioni sui prezzi per eventi aziendali.",
  "payload testo: corpo messaggio non coerente",
);
assert.equal(textMessages[0]?.content.media, null, "payload testo: media inatteso");

const mediaMessages = extractWhatsAppInboundMessages(fixtures["inbound_media_image"]);
assert.equal(mediaMessages.length, 1, "payload media: messaggio non estratto");
assert.equal(mediaMessages[0]?.content.text, "[image] - Brochure di riferimento del competitor", "payload media: testo sintetico non coerente");
assert.equal(mediaMessages[0]?.content.media?.media_id, "444555666777", "payload media: media id non coerente");
assert.equal(mediaMessages[0]?.content.media?.media_tipo, "image", "payload media: tipo non coerente");
assert.equal(mediaMessages[0]?.content.media?.media_mime_type, "image/jpeg", "payload media: mime type non coerente");

const deliveredStatuses = extractWhatsAppStatuses(fixtures["message_status_delivered"]);
assert.equal(deliveredStatuses.length, 1, "status delivered: evento non estratto");
assert.equal(deliveredStatuses[0]?.status, "delivered", "status delivered: stato non coerente");
assert.equal(deliveredStatuses[0]?.recipientId, "393331234567", "status delivered: recipient non coerente");

const readStatuses = extractWhatsAppStatuses(fixtures["message_status_read"]);
assert.equal(readStatuses[0]?.status, "read", "status read: stato non coerente");

assert.equal(extractWhatsAppInboundMessages(fixtures["incomplete_payload"]).length, 0, "payload incompleto: messaggi inattesi");
assert.equal(extractWhatsAppStatuses(fixtures["incomplete_payload"]).length, 0, "payload incompleto: status inattesi");
assert.equal(normalizePhoneForLookup("+39 333 123 4567"), "393331234567", "normalizzazione telefono +39 non coerente");
assert.equal(normalizePhoneForLookup("0039 333 123 4567"), "393331234567", "normalizzazione telefono 00 non coerente");

const rawBody = Buffer.from(JSON.stringify(fixtures["inbound_text_message"]));
const appSecret = "test_secret";
const validSignature = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
assert.equal(isMetaSignatureValid(validSignature, rawBody, appSecret), true, "firma Meta valida rifiutata");
assert.equal(isMetaSignatureValid("sha256=invalid", rawBody, appSecret), false, "firma Meta invalida accettata");
assert.equal(isMetaSignatureValid(undefined, rawBody, undefined), true, "firma Meta deve essere opzionale senza secret configurato");

console.log("WhatsApp webhook parser tests passed (payload text/media/status/signature).");

