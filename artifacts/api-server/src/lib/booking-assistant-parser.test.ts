import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  extractDataEvento,
  extractNumeroInvitati,
  extractTipoEvento,
  getCurrentBookingStep,
  getMissingBookingSteps,
  isHandoffRequest,
  renderTemplate,
} from "./booking-assistant-parser";

type Fixture = {
  raw_input: string;
  expected_extraction: {
    tipo_evento: string | null;
    data_evento: string | null;
    numero_invitati: number | null;
  };
  routing?: {
    action: string;
  };
};

function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (current !== path.dirname(current)) {
    if (existsSync(path.join(current, "attached_assets"))) return current;
    current = path.dirname(current);
  }
  throw new Error(`Repo root non trovata partendo da ${startDir}`);
}

const fixturePath = path.join(findRepoRoot(process.cwd()), "attached_assets", "booking-assistant-test-fixtures.json");
const fixtures = JSON.parse(await readFile(fixturePath, "utf8")) as Record<string, Fixture>;

const normalizeExpectedEventType = (value: string | null) => {
  if (value === "meeting_aziendale") return "aziendale";
  if (value === "private_party") return undefined;
  return value ?? undefined;
};

for (const [caseName, fixture] of Object.entries(fixtures)) {
  const expectedTipoEvento = normalizeExpectedEventType(fixture.expected_extraction.tipo_evento);
  const expectedDataEvento = fixture.expected_extraction.data_evento ?? undefined;
  const expectedNumeroInvitati = fixture.expected_extraction.numero_invitati ?? undefined;

  assert.equal(
    extractTipoEvento(fixture.raw_input),
    expectedTipoEvento,
    `${caseName}: tipo evento estratto non coerente`,
  );
  assert.equal(
    extractDataEvento(fixture.raw_input),
    expectedDataEvento,
    `${caseName}: data evento estratta non coerente`,
  );
  assert.equal(
    extractNumeroInvitati(fixture.raw_input),
    expectedNumeroInvitati,
    `${caseName}: numero invitati estratto non coerente`,
  );

  if (fixture.routing?.action === "human_escalation") {
    assert.equal(isHandoffRequest(fixture.raw_input), true, `${caseName}: handoff non rilevato`);
  }
}

assert.equal(
  renderTemplate("Ciao {{ nome }}, data {{data_evento}}", { nome: "Mario", data_evento: "14/09/2026" }),
  "Ciao Mario, data 14/09/2026",
  "render template con placeholder spaziati non coerente",
);

assert.deepEqual(
  getMissingBookingSteps({ nome: "Sconosciuto" }),
  ["nome", "tipo_evento", "data_evento", "numero_invitati"],
  "step mancanti iniziali non coerenti",
);

assert.equal(
  getCurrentBookingStep({
    nome: "Mario Rossi",
    tipo_evento: "laurea",
    data_evento_richiesta: "2026-09-14",
    numero_invitati: 80,
  }),
  "completo",
  "step completo non rilevato",
);

assert.equal(
  getCurrentBookingStep({ handoff_richiesto: true }),
  "handoff",
  "step handoff non rilevato",
);

console.log(`Booking Assistant parser tests passed (${Object.keys(fixtures).length} fixture).`);
