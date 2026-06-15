import { Router } from "express";
import { db, agendaPersonaleTable, contattiCrmTable, insertAgendaItemSchema, updateAgendaItemSchema } from "@workspace/db";
import { ImportAgendaNumbersCsvBody } from "@workspace/api-zod";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { logAuditAction } from "../lib/audit-log";
import { deleteGoogleCalendarEvent, syncAgendaItemToGoogle } from "../lib/google-calendar";
import {
  annotateExistingAgendaItems,
  buildNumbersAgendaDescription,
  buildNumbersAgendaExistingKey,
  parseNumbersAgendaCsv,
} from "../lib/numbers-agenda-import";
import { parseLimit, parseOffset } from "../lib/pagination";
import { requireRole } from "../lib/auth";

const router = Router();

function parseAgendaDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateAgendaRange(start: Date, end: Date) {
  return start.getTime() < end.getTime();
}

router.get("/agenda", async (req, res) => {
  const { categoria, data_da, data_a, limit, offset } = req.query as Record<string, string | undefined>;
  const lim = parseLimit(limit, 200, 500);
  const off = parseOffset(offset);
  const conditions = [];
  if (categoria) conditions.push(eq(agendaPersonaleTable.categoria, categoria));
  if (data_da) conditions.push(gte(agendaPersonaleTable.data_ora_inizio, new Date(data_da)));
  if (data_a) conditions.push(lte(agendaPersonaleTable.data_ora_fine, new Date(data_a)));

  const rows = await db
    .select({
      id: agendaPersonaleTable.id,
      titolo: agendaPersonaleTable.titolo,
      descrizione: agendaPersonaleTable.descrizione,
      data_ora_inizio: agendaPersonaleTable.data_ora_inizio,
      data_ora_fine: agendaPersonaleTable.data_ora_fine,
      categoria: agendaPersonaleTable.categoria,
      contatto_id: agendaPersonaleTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      promemoria_inviato: agendaPersonaleTable.promemoria_inviato,
    })
    .from(agendaPersonaleTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, agendaPersonaleTable.contatto_id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(agendaPersonaleTable.data_ora_inizio)
    .limit(lim)
    .offset(off);
  res.json(rows);
});

router.post("/agenda", async (req, res) => {
  const parsed = insertAgendaItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const dataOraInizio = parseAgendaDate(parsed.data.data_ora_inizio);
  const dataOraFine = parseAgendaDate(parsed.data.data_ora_fine);
  if (!dataOraInizio || !dataOraFine) {
    res.status(400).json({ error: "Date agenda non valide" });
    return;
  }
  if (!validateAgendaRange(dataOraInizio, dataOraFine)) {
    res.status(400).json({ error: "data_ora_fine deve essere successiva a data_ora_inizio" });
    return;
  }
  const data = {
    ...parsed.data,
    data_ora_inizio: dataOraInizio,
    data_ora_fine: dataOraFine,
  };
  const [row] = await db.insert(agendaPersonaleTable).values(data).returning();
  await syncAgendaItemToGoogle(row);
  await logAuditAction({ req, azione: "create", entita: "agenda", entitaId: row.id, dettagli: { categoria: row.categoria, titolo: row.titolo } });
  res.status(201).json({ ...row, contatto_nome: null });
});

router.post("/agenda/import-numbers-csv", requireRole("manager"), async (req, res) => {
  const parsedBody = ImportAgendaNumbersCsvBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const csv = parsedBody.data.csv.trim();
  if (!csv) {
    res.status(400).json({ error: "csv required" });
    return;
  }

  const parsed = parseNumbersAgendaCsv(csv, {
    year: parsedBody.data.year,
    defaultMonth: parsedBody.data.default_month ?? undefined,
    category: parsedBody.data.categoria ?? "lavoro",
    pSlotLabel: parsedBody.data.p_slot_label ?? "P",
    pStartTime: parsedBody.data.p_start_time ?? "13:00",
    pEndTime: parsedBody.data.p_end_time ?? "17:00",
    cSlotLabel: parsedBody.data.c_slot_label ?? "C",
    cStartTime: parsedBody.data.c_start_time ?? "20:00",
    cEndTime: parsedBody.data.c_end_time ?? "23:59",
  });

  const existingAgenda = await db.select({
    data_ora_inizio: agendaPersonaleTable.data_ora_inizio,
    titolo: agendaPersonaleTable.titolo,
    descrizione: agendaPersonaleTable.descrizione,
  }).from(agendaPersonaleTable);

  const existingKeys = new Set(existingAgenda.map((item) => buildNumbersAgendaExistingKey({
    data_ora_inizio: item.data_ora_inizio.toISOString(),
    titolo: item.titolo,
    descrizione: item.descrizione,
  })));

  const items = annotateExistingAgendaItems(parsed.items, existingKeys);
  const dryRun = parsedBody.data.dry_run !== false;

  let creati = 0;
  let saltati = 0;
  if (!dryRun) {
    for (const item of items) {
      if (item.gia_presente) {
        saltati++;
        continue;
      }

      const [row] = await db.insert(agendaPersonaleTable).values({
        titolo: item.titolo,
        descrizione: buildNumbersAgendaDescription(item),
        data_ora_inizio: new Date(item.data_ora_inizio),
        data_ora_fine: new Date(item.data_ora_fine),
        categoria: parsedBody.data.categoria ?? "lavoro",
      }).returning();

      await syncAgendaItemToGoogle(row);
      creati++;
    }
  } else {
    saltati = items.filter((item) => item.gia_presente).length;
  }

  await logAuditAction({
    req,
    azione: dryRun ? "import_numbers_preview" : "import_numbers_csv",
    entita: "agenda",
    dettagli: {
      totale_righe: parsed.totalRows,
      trovati: items.length,
      creati,
      saltati: dryRun ? items.filter((item) => item.gia_presente).length : saltati,
      errori: parsed.errors.length,
    },
  });

  res.json({
    totale_righe: parsed.totalRows,
    trovati: items.length,
    creati,
    saltati: dryRun ? items.filter((item) => item.gia_presente).length : saltati,
    errori: parsed.errors,
    items,
  });
});

router.get("/agenda/:id", async (req, res) => {
  const [row] = await db
    .select({
      id: agendaPersonaleTable.id,
      titolo: agendaPersonaleTable.titolo,
      descrizione: agendaPersonaleTable.descrizione,
      data_ora_inizio: agendaPersonaleTable.data_ora_inizio,
      data_ora_fine: agendaPersonaleTable.data_ora_fine,
      categoria: agendaPersonaleTable.categoria,
      contatto_id: agendaPersonaleTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      promemoria_inviato: agendaPersonaleTable.promemoria_inviato,
    })
    .from(agendaPersonaleTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, agendaPersonaleTable.contatto_id))
    .where(eq(agendaPersonaleTable.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.patch("/agenda/:id", async (req, res) => {
  const parsed = updateAgendaItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  const [existing] = await db.select().from(agendaPersonaleTable).where(eq(agendaPersonaleTable.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const dataOraInizio = data.data_ora_inizio ? parseAgendaDate(data.data_ora_inizio) : existing.data_ora_inizio;
  const dataOraFine = data.data_ora_fine ? parseAgendaDate(data.data_ora_fine) : existing.data_ora_fine;
  if (!dataOraInizio || !dataOraFine) {
    res.status(400).json({ error: "Date agenda non valide" });
    return;
  }
  if (!validateAgendaRange(dataOraInizio, dataOraFine)) {
    res.status(400).json({ error: "data_ora_fine deve essere successiva a data_ora_inizio" });
    return;
  }

  if (data.data_ora_inizio) {
    data.data_ora_inizio = dataOraInizio;
    if (dataOraInizio.getTime() !== existing.data_ora_inizio.getTime() && dataOraInizio > new Date()) {
      data.promemoria_inviato = false;
    }
  }
  if (data.data_ora_fine) data.data_ora_fine = dataOraFine;
  const [row] = await db.update(agendaPersonaleTable).set(data).where(eq(agendaPersonaleTable.id, req.params.id)).returning();
  await syncAgendaItemToGoogle(row);
  await logAuditAction({ req, azione: "update", entita: "agenda", entitaId: row.id, dettagli: parsed.data });
  res.json(row);
});

router.delete("/agenda/:id", async (req, res) => {
  const [existing] = await db.select().from(agendaPersonaleTable).where(eq(agendaPersonaleTable.id, req.params.id));
  await deleteGoogleCalendarEvent(existing?.google_event_id);
  await db.delete(agendaPersonaleTable).where(eq(agendaPersonaleTable.id, req.params.id));
  await logAuditAction({ req, azione: "delete", entita: "agenda", entitaId: req.params.id });
  res.status(204).send();
});

export default router;
