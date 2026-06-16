import { Router } from "express";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import {
  contattiCrmTable,
  db,
  eventPaymentsTable,
  eventStaffAllocationTable,
  preventiviEventiTable,
  utentiTable,
} from "@workspace/db";
import {
  CreateEventPaymentBody,
  CreateEventStaffAllocationBody,
  UpdateEventPaymentBody,
  UpdateEventStaffAllocationBody,
  UpdateEventStatusBody,
} from "@workspace/api-zod";
import { logAuditAction } from "../lib/audit-log";
import { type StaffRole } from "../lib/auth";
import { syncPreventivoToGoogle } from "../lib/google-calendar";

const router = Router();

const eventStageOrder = ["draft", "quoted", "confirmed", "in_production", "closed"] as const;
type EventStage = typeof eventStageOrder[number];

const roleRank: Record<StaffRole, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
};

function parseNumeric(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePayment(row: typeof eventPaymentsTable.$inferSelect) {
  return {
    ...row,
    amount: parseNumeric(row.amount),
    payment_method: row.payment_method ?? null,
    paid_at: row.paid_at ?? null,
  };
}

function normalizeCommercialState(eventStage: EventStage, currentStatoEvento: string) {
  if (eventStageOrder.indexOf(eventStage) >= eventStageOrder.indexOf("confirmed")) {
    return "confermato";
  }
  if (currentStatoEvento === "confermato") {
    return "opzionato";
  }
  return currentStatoEvento;
}

function isForwardTransition(currentStage: EventStage, nextStage: EventStage) {
  return eventStageOrder.indexOf(nextStage) === eventStageOrder.indexOf(currentStage) + 1;
}

async function loadEventOrNull(eventId: string) {
  const [eventRow] = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      contatto_telefono: contattiCrmTable.telefono,
      tipo_evento: contattiCrmTable.tipo_evento,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      event_stage: preventiviEventiTable.event_stage,
      menu_cibo: preventiviEventiTable.menu_cibo,
      menu_bevande: preventiviEventiTable.menu_bevande,
      note_allergie: preventiviEventiTable.note_allergie,
      note_logistica: preventiviEventiTable.note_logistica,
      data_creazione: preventiviEventiTable.data_creazione,
      google_calendar_id: preventiviEventiTable.google_calendar_id,
      google_event_id: preventiviEventiTable.google_event_id,
      google_sync_status: preventiviEventiTable.google_sync_status,
      google_last_synced_at: preventiviEventiTable.google_last_synced_at,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(eq(preventiviEventiTable.id, eventId));

  if (!eventRow) return null;

  const payments = await db
    .select()
    .from(eventPaymentsTable)
    .where(eq(eventPaymentsTable.event_id, eventId))
    .orderBy(asc(eventPaymentsTable.due_date), asc(eventPaymentsTable.data_creazione));

  const staffAllocations = await db
    .select({
      id: eventStaffAllocationTable.id,
      event_id: eventStaffAllocationTable.event_id,
      user_id: eventStaffAllocationTable.user_id,
      user_nome: utentiTable.nome,
      user_ruolo: utentiTable.ruolo,
      role_allocated: eventStaffAllocationTable.role_allocated,
      data_creazione: eventStaffAllocationTable.data_creazione,
    })
    .from(eventStaffAllocationTable)
    .innerJoin(utentiTable, eq(eventStaffAllocationTable.user_id, utentiTable.id))
    .where(eq(eventStaffAllocationTable.event_id, eventId))
    .orderBy(asc(eventStaffAllocationTable.role_allocated), asc(utentiTable.nome));

  const normalizedPayments = payments.map(normalizePayment);
  const totalePagato = normalizedPayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const budgetTotale = parseNumeric(eventRow.budget_stimato);
  const pendingPayments = normalizedPayments
    .filter((payment) => payment.status === "pending")
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));

  return {
    ...eventRow,
    contatto_nome: eventRow.contatto_nome ?? null,
    contatto_telefono: eventRow.contatto_telefono ?? null,
    tipo_evento: eventRow.tipo_evento ?? null,
    budget_stimato: budgetTotale,
    menu_cibo: eventRow.menu_cibo ?? null,
    menu_bevande: eventRow.menu_bevande ?? null,
    note_allergie: eventRow.note_allergie ?? null,
    note_logistica: eventRow.note_logistica ?? null,
    pagamenti: normalizedPayments,
    staff_allocato: staffAllocations.map((allocation) => ({
      ...allocation,
      user_ruolo: allocation.user_ruolo ?? null,
    })),
    financial_summary: {
      budget_totale: budgetTotale,
      totale_pagato: totalePagato,
      saldo_residuo: budgetTotale - totalePagato,
      prossima_scadenza: pendingPayments[0]?.due_date ?? null,
    },
  };
}

async function hasAdvancePayment(eventId: string) {
  const [advanceOne] = await db
    .select({ id: eventPaymentsTable.id })
    .from(eventPaymentsTable)
    .where(and(
      eq(eventPaymentsTable.event_id, eventId),
      eq(eventPaymentsTable.payment_type, "acconto_1"),
    ))
    .limit(1);

  if (advanceOne) return true;

  const [advanceTwo] = await db
    .select({ id: eventPaymentsTable.id })
    .from(eventPaymentsTable)
    .where(and(
      eq(eventPaymentsTable.event_id, eventId),
      eq(eventPaymentsTable.payment_type, "acconto_2"),
    ))
    .limit(1);

  return Boolean(advanceTwo);
}

router.get("/events/:id", async (req, res) => {
  const eventDetail = await loadEventOrNull(req.params.id);
  if (!eventDetail) {
    res.status(404).json({ error: "Evento non trovato" });
    return;
  }
  res.json(eventDetail);
});

router.patch("/events/:id/status", async (req, res) => {
  const parsed = UpdateEventStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db
    .select({
      id: preventiviEventiTable.id,
      event_stage: preventiviEventiTable.event_stage,
      stato_evento: preventiviEventiTable.stato_evento,
      contatto_nome: contattiCrmTable.nome,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(eq(preventiviEventiTable.id, req.params.id));

  if (!current) {
    res.status(404).json({ error: "Evento non trovato" });
    return;
  }

  const nextStage = parsed.data.event_stage as EventStage;
  const currentStage = current.event_stage as EventStage;
  const userRole = req.authUser?.ruolo ?? "staff";
  const isManagerOverride = roleRank[userRole] >= roleRank.manager;

  if (currentStage !== nextStage && !isManagerOverride && !isForwardTransition(currentStage, nextStage)) {
    res.status(400).json({ error: "Transizione non consentita per il ruolo staff." });
    return;
  }

  if (eventStageOrder.indexOf(nextStage) >= eventStageOrder.indexOf("confirmed")) {
    const advancePaymentExists = await hasAdvancePayment(req.params.id);
    if (!advancePaymentExists && !isManagerOverride) {
      res.status(403).json({ error: "Serve almeno un pagamento di acconto per confermare l'evento." });
      return;
    }
  }

  const [updated] = await db
    .update(preventiviEventiTable)
    .set({
      event_stage: nextStage,
      stato_evento: normalizeCommercialState(nextStage, current.stato_evento),
    })
    .where(eq(preventiviEventiTable.id, req.params.id))
    .returning();

  if (updated.stato_evento === "confermato") {
    await syncPreventivoToGoogle({ ...updated, contatto_nome: current.contatto_nome ?? null });
  }

  await logAuditAction({
    req,
    azione: "update_status",
    entita: "evento",
    entitaId: req.params.id,
    dettagli: { current_stage: currentStage, next_stage: nextStage },
  });

  const eventDetail = await loadEventOrNull(req.params.id);
  res.json(eventDetail);
});

router.get("/events/:id/payments", async (req, res) => {
  const rows = await db
    .select()
    .from(eventPaymentsTable)
    .where(eq(eventPaymentsTable.event_id, req.params.id))
    .orderBy(asc(eventPaymentsTable.due_date), asc(eventPaymentsTable.data_creazione));

  res.json(rows.map(normalizePayment));
});

router.post("/events/:id/payments", async (req, res) => {
  const parsed = CreateEventPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existingEvent] = await db
    .select({ id: preventiviEventiTable.id })
    .from(preventiviEventiTable)
    .where(eq(preventiviEventiTable.id, req.params.id));

  if (!existingEvent) {
    res.status(404).json({ error: "Evento non trovato" });
    return;
  }

  const [row] = await db
    .insert(eventPaymentsTable)
    .values({
      event_id: req.params.id,
      payment_type: parsed.data.payment_type,
      amount: parsed.data.amount.toFixed(2),
      due_date: parsed.data.due_date,
      status: parsed.data.status ?? "pending",
      paid_at: parsed.data.status === "paid" ? new Date() : null,
      payment_method: parsed.data.payment_method ?? null,
    })
    .returning();

  await logAuditAction({
    req,
    azione: "create",
    entita: "event_payment",
    entitaId: row.id,
    dettagli: { event_id: req.params.id, payment_type: row.payment_type, amount: row.amount },
  });

  res.status(201).json(normalizePayment(row));
});

router.patch("/events/:id/payments/:paymentId", async (req, res) => {
  const parsed = UpdateEventPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(eventPaymentsTable)
    .where(and(
      eq(eventPaymentsTable.event_id, req.params.id),
      eq(eventPaymentsTable.id, req.params.paymentId),
    ));

  if (!existing) {
    res.status(404).json({ error: "Pagamento non trovato" });
    return;
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const [updated] = await db
    .update(eventPaymentsTable)
    .set({
      payment_type: parsed.data.payment_type ?? existing.payment_type,
      amount: parsed.data.amount !== undefined ? parsed.data.amount.toFixed(2) : existing.amount,
      due_date: parsed.data.due_date ?? existing.due_date,
      status: nextStatus,
      payment_method: parsed.data.payment_method ?? existing.payment_method,
      paid_at: nextStatus === "paid" ? existing.paid_at ?? new Date() : null,
    })
    .where(eq(eventPaymentsTable.id, req.params.paymentId))
    .returning();

  await logAuditAction({
    req,
    azione: "update",
    entita: "event_payment",
    entitaId: updated.id,
    dettagli: parsed.data,
  });

  res.json(normalizePayment(updated));
});

router.delete("/events/:id/payments/:paymentId", async (req, res) => {
  await db
    .delete(eventPaymentsTable)
    .where(and(
      eq(eventPaymentsTable.event_id, req.params.id),
      eq(eventPaymentsTable.id, req.params.paymentId),
    ));

  await logAuditAction({
    req,
    azione: "delete",
    entita: "event_payment",
    entitaId: req.params.paymentId,
    dettagli: { event_id: req.params.id },
  });

  res.status(204).send();
});

router.get("/events/:id/staff", async (req, res) => {
  const rows = await db
    .select({
      id: eventStaffAllocationTable.id,
      event_id: eventStaffAllocationTable.event_id,
      user_id: eventStaffAllocationTable.user_id,
      user_nome: utentiTable.nome,
      user_ruolo: utentiTable.ruolo,
      role_allocated: eventStaffAllocationTable.role_allocated,
      data_creazione: eventStaffAllocationTable.data_creazione,
    })
    .from(eventStaffAllocationTable)
    .innerJoin(utentiTable, eq(eventStaffAllocationTable.user_id, utentiTable.id))
    .where(eq(eventStaffAllocationTable.event_id, req.params.id))
    .orderBy(asc(eventStaffAllocationTable.role_allocated), asc(utentiTable.nome));

  res.json(rows);
});

router.post("/events/:id/staff", async (req, res) => {
  const parsed = CreateEventStaffAllocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [duplicate] = await db
    .select({ id: eventStaffAllocationTable.id })
    .from(eventStaffAllocationTable)
    .where(and(
      eq(eventStaffAllocationTable.event_id, req.params.id),
      eq(eventStaffAllocationTable.user_id, parsed.data.user_id),
      eq(eventStaffAllocationTable.role_allocated, parsed.data.role_allocated),
    ));

  if (duplicate) {
    res.status(409).json({ error: "Assegnazione gia presente" });
    return;
  }

  const [row] = await db
    .insert(eventStaffAllocationTable)
    .values({
      event_id: req.params.id,
      user_id: parsed.data.user_id,
      role_allocated: parsed.data.role_allocated,
    })
    .returning();

  const [joined] = await db
    .select({
      id: eventStaffAllocationTable.id,
      event_id: eventStaffAllocationTable.event_id,
      user_id: eventStaffAllocationTable.user_id,
      user_nome: utentiTable.nome,
      user_ruolo: utentiTable.ruolo,
      role_allocated: eventStaffAllocationTable.role_allocated,
      data_creazione: eventStaffAllocationTable.data_creazione,
    })
    .from(eventStaffAllocationTable)
    .innerJoin(utentiTable, eq(eventStaffAllocationTable.user_id, utentiTable.id))
    .where(eq(eventStaffAllocationTable.id, row.id));

  await logAuditAction({
    req,
    azione: "create",
    entita: "event_staff_allocation",
    entitaId: row.id,
    dettagli: { event_id: req.params.id, user_id: row.user_id, role_allocated: row.role_allocated },
  });

  res.status(201).json(joined);
});

router.patch("/events/:id/staff/:allocationId", async (req, res) => {
  const parsed = UpdateEventStaffAllocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(eventStaffAllocationTable)
    .where(and(
      eq(eventStaffAllocationTable.event_id, req.params.id),
      eq(eventStaffAllocationTable.id, req.params.allocationId),
    ));

  if (!existing) {
    res.status(404).json({ error: "Assegnazione non trovata" });
    return;
  }

  const nextUserId = parsed.data.user_id ?? existing.user_id;
  const nextRoleAllocated = parsed.data.role_allocated ?? existing.role_allocated;

  const [duplicate] = await db
    .select({ id: eventStaffAllocationTable.id })
    .from(eventStaffAllocationTable)
    .where(and(
      eq(eventStaffAllocationTable.event_id, req.params.id),
      eq(eventStaffAllocationTable.user_id, nextUserId),
      eq(eventStaffAllocationTable.role_allocated, nextRoleAllocated),
      ne(eventStaffAllocationTable.id, req.params.allocationId),
    ));

  if (duplicate) {
    res.status(409).json({ error: "Assegnazione gia presente" });
    return;
  }

  await db
    .update(eventStaffAllocationTable)
    .set({
      user_id: nextUserId,
      role_allocated: nextRoleAllocated,
    })
    .where(eq(eventStaffAllocationTable.id, req.params.allocationId));

  const [joined] = await db
    .select({
      id: eventStaffAllocationTable.id,
      event_id: eventStaffAllocationTable.event_id,
      user_id: eventStaffAllocationTable.user_id,
      user_nome: utentiTable.nome,
      user_ruolo: utentiTable.ruolo,
      role_allocated: eventStaffAllocationTable.role_allocated,
      data_creazione: eventStaffAllocationTable.data_creazione,
    })
    .from(eventStaffAllocationTable)
    .innerJoin(utentiTable, eq(eventStaffAllocationTable.user_id, utentiTable.id))
    .where(eq(eventStaffAllocationTable.id, req.params.allocationId));

  await logAuditAction({
    req,
    azione: "update",
    entita: "event_staff_allocation",
    entitaId: req.params.allocationId,
    dettagli: parsed.data,
  });

  res.json(joined);
});

router.delete("/events/:id/staff/:allocationId", async (req, res) => {
  await db
    .delete(eventStaffAllocationTable)
    .where(and(
      eq(eventStaffAllocationTable.event_id, req.params.id),
      eq(eventStaffAllocationTable.id, req.params.allocationId),
    ));

  await logAuditAction({
    req,
    azione: "delete",
    entita: "event_staff_allocation",
    entitaId: req.params.allocationId,
    dettagli: { event_id: req.params.id },
  });

  res.status(204).send();
});

export default router;
