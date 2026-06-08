import assert from "node:assert/strict";
import { normalizeBookingLlmExtraction } from "./llm-booking-extractor";

const extraction = normalizeBookingLlmExtraction({
  nome: "Marco Rossi",
  tipo_evento: "laurea",
  data_evento_richiesta: "2026-07-18",
  numero_invitati: 82.4,
  budget_stimato: 3500,
  preferenze: ["open bar", "dj set"],
  handoff_richiesto: false,
  livello_confidenza: "alto",
  dati_mancanti: [],
});

assert.deepEqual(extraction, {
  nome: "Marco Rossi",
  tipo_evento: "laurea",
  data_evento_richiesta: "2026-07-18",
  numero_invitati: 82,
  budget_stimato: 3500,
  preferenze: ["open bar", "dj set"],
  handoff_richiesto: false,
  livello_confidenza: "alto",
  dati_mancanti: [],
});

const unknownType = normalizeBookingLlmExtraction({
  nome: null,
  tipo_evento: "evento_privato",
  data_evento_richiesta: "18/07/2026",
  numero_invitati: -1,
  budget_stimato: null,
  preferenze: [null, "buffet"],
  handoff_richiesto: true,
  livello_confidenza: "molto alto",
  dati_mancanti: ["data_evento"],
});

assert.equal(unknownType?.tipo_evento, undefined);
assert.equal(unknownType?.data_evento_richiesta, undefined);
assert.equal(unknownType?.numero_invitati, undefined);
assert.equal(unknownType?.handoff_richiesto, true);
assert.equal(unknownType?.livello_confidenza, "basso");
assert.deepEqual(unknownType?.preferenze, ["buffet"]);

console.log("LLM Booking extractor tests passed.");
