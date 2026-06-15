import assert from "node:assert/strict";
import {
  annotateExistingAgendaItems,
  buildNumbersAgendaDescription,
  buildNumbersAgendaExistingKey,
  parseNumbersAgendaCsv,
} from "./numbers-agenda-import";

const csv = [
  "GIUGNO;;;;ACCONTO",
  ";;;;SI;NO",
  "1;L;P;;;",
  "; ;C;Cecere 180;X;",
  "2;M;P;;;",
  "; ;C;D'Orto Francesco comunione;X;",
  "6;S;P;;;",
  "; ;C;Liguori 1o compleanno;X;",
].join("\n");

const parsed = parseNumbersAgendaCsv(csv, {
  year: 2026,
  defaultMonth: undefined,
  category: "lavoro",
  pSlotLabel: "P",
  pStartTime: "13:00",
  pEndTime: "17:00",
  cSlotLabel: "C",
  cStartTime: "20:00",
  cEndTime: "23:59",
});

assert.equal(parsed.items.length, 3);
assert.equal(parsed.errors.length, 0);
assert.equal(parsed.items[0]?.titolo, "Cecere 180");
assert.equal(parsed.items[0]?.acconto_stato, "si");
assert.equal(parsed.items[0]?.data, "2026-06-01");
assert.match(parsed.items[0]?.data_ora_inizio ?? "", /^2026-06-01T20:00:00\+/);

const existingKey = buildNumbersAgendaExistingKey({
  data_ora_inizio: parsed.items[0]?.data_ora_inizio ?? "",
  titolo: parsed.items[0]?.titolo ?? "",
  descrizione: "Importato da Apple Numbers\nSlot: C",
});

const annotated = annotateExistingAgendaItems(parsed.items, new Set([existingKey]));
assert.equal(annotated[0]?.gia_presente, true);
assert.equal(annotated[1]?.gia_presente, false);
assert.match(buildNumbersAgendaDescription(annotated[0]!), /Acconto: si/);

console.log("Numbers agenda import tests passed.");
