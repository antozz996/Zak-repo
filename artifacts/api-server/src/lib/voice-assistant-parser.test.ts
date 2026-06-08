import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildAgendaTitle,
  buildTaskTitle,
  extractVoicePriority,
  parseVoiceIntent,
} from "./voice-assistant-parser";

type VoiceFixture = {
  transcript: string;
  expected_parsed_intent: {
    intent: string;
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

const fixturePath = path.join(findRepoRoot(process.cwd()), "attached_assets", "voice-assistant-test-fixtures.json");
const fixtures = JSON.parse(await readFile(fixturePath, "utf8")) as Record<string, VoiceFixture>;

const agendaCases = [
  "crea_evento_agenda",
  "data_domani",
  "data_dopodomani",
  "orario_alle_15",
  "transcript_senza_telefono",
];
const taskCases = ["crea_task_staff", "priorita_urgente"];

for (const caseName of agendaCases) {
  const fixture = fixtures[caseName];
  assert.ok(fixture, `${caseName}: fixture mancante`);
  const intent = parseVoiceIntent(fixture.transcript);
  assert.equal(intent.type, "agenda", `${caseName}: intento agenda non rilevato`);
  assert.equal(intent.dateTime.explicit, true, `${caseName}: data/orario esplicito non rilevato`);
  assert.ok(intent.dateTime.date, `${caseName}: data agenda mancante`);
}

for (const caseName of taskCases) {
  const fixture = fixtures[caseName];
  assert.ok(fixture, `${caseName}: fixture mancante`);
  const intent = parseVoiceIntent(fixture.transcript);
  assert.equal(intent.type, "task", `${caseName}: intento task non rilevato`);
}

const domani = parseVoiceIntent(fixtures["data_domani"].transcript).dateTime.date;
assert.equal(domani?.getHours(), 10, "data_domani: ora non coerente");
assert.equal(domani?.getMinutes(), 0, "data_domani: minuti non coerenti");

const dopodomani = parseVoiceIntent(fixtures["data_dopodomani"].transcript).dateTime.date;
assert.equal(dopodomani?.getHours(), 15, "data_dopodomani: ora non coerente");
assert.equal(dopodomani?.getMinutes(), 0, "data_dopodomani: minuti non coerenti");

assert.equal(extractVoicePriority(fixtures["priorita_urgente"].transcript), "urgente", "priorita urgente non coerente");
assert.equal(
  buildTaskTitle(fixtures["crea_task_staff"].transcript).toLowerCase().startsWith("inviare la brochure"),
  true,
  "titolo task non ripulito dal comando vocale",
);
assert.equal(
  buildAgendaTitle("Fissa sopralluogo sala", { nome: "Mario Rossi" }),
  "sopralluogo sala - Mario Rossi",
  "titolo agenda con contatto non coerente",
);

const ambiguousIntent = parseVoiceIntent(fixtures["transcript_ambiguo"].transcript);
assert.equal(ambiguousIntent.confidence, "bassa", "transcript ambiguo non classificato a bassa confidenza");

console.log(`Voice Assistant parser tests passed (${agendaCases.length + taskCases.length + 5} assertions).`);

