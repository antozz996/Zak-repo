import assert from "node:assert/strict";
import {
  isVoiceWebhookAuthorized,
  parseVoiceProviderPayload,
} from "./voice-provider-parser";

const vapi = parseVoiceProviderPayload({
  message: {
    type: "end-of-call-report",
    call: {
      id: "call_vapi_1",
      customer: { number: "+393331234567" },
      durationSeconds: 245,
      recordingUrl: "https://example.com/rec.mp3",
      transcript: "Cliente: vorrei una laurea per 80 persone il 20 giugno 2026",
      summary: "Richiesta laurea per 80 persone.",
      analysis: {
        intent: "richiesta_preventivo",
        parameters: {
          customer_name: "Marco Rossi",
          customer_email: "marco@example.com",
          event_date: "2026-06-20",
          guest_count: 80,
          event_type: "laurea",
        },
      },
    },
  },
});

assert.equal(vapi?.provider, "vapi");
assert.equal(vapi?.callId, "call_vapi_1");
assert.equal(vapi?.telefono, "+393331234567");
assert.equal(vapi?.durata, 5);
assert.equal(vapi?.customerName, "Marco Rossi");
assert.equal(vapi?.eventDate, "2026-06-20");
assert.equal(vapi?.guestCount, 80);

const bland = parseVoiceProviderPayload({
  provider: "bland",
  call_id: "call_bland_1",
  from: "+393339998877",
  call_length: 3,
  concatenated_transcript: "Cliente: mi serve un compleanno per 50 invitati",
  variables: {
    nome: "Giulia Bianchi",
    data_evento: "2026-07-10",
    numero_invitati: "50",
    tipo_evento: "compleanno",
  },
});

assert.equal(bland?.provider, "bland");
assert.equal(bland?.telefono, "+393339998877");
assert.equal(bland?.customerName, "Giulia Bianchi");
assert.equal(bland?.eventDate, "2026-07-10");
assert.equal(bland?.guestCount, 50);

process.env["VOICE_WEBHOOK_SECRET"] = "secret-test";
assert.equal(isVoiceWebhookAuthorized({ provider: "generic", webhookSecret: "secret-test" }), true);
assert.equal(isVoiceWebhookAuthorized({ provider: "generic", webhookSecret: "wrong" }), false);
delete process.env["VOICE_WEBHOOK_SECRET"];

console.log("Voice provider parser tests passed.");
