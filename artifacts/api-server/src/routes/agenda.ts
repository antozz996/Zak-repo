import { Router } from "express";
import { db, agendaPersonaleTable, contattiCrmTable, insertAgendaItemSchema, updateAgendaItemSchema } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { logAuditAction } from "../lib/audit-log";
import { deleteGoogleCalendarEvent, syncAgendaItemToGoogle } from "../lib/google-calendar";

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
  const { categoria, data_da, data_a } = req.query as Record<string, string>;
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
    .orderBy(agendaPersonaleTable.data_ora_inizio);
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
