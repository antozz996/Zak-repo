import { Router } from "express";
import {
  auditLogTable,
  contattiCrmTable,
  db,
  eventPaymentsTable,
  preventiviEventiTable,
} from "@workspace/db";
import { AcceptPublicQuoteBody } from "@workspace/api-zod";
import { and, eq, ne } from "drizzle-orm";
import { logLeadStatusChange } from "../lib/lead-status-history";
import { notifyManagersAndAdmins } from "../lib/notifications";
import { createSystemMessage, syncLinkedAgendaForPreventivo } from "../lib/preventivo-links";
import { syncPreventivoToGoogle } from "../lib/google-calendar";

const router = Router();

async function hasConfirmedDateConflict(dataEventoRichiesta?: string | null, excludeId?: string) {
  if (!dataEventoRichiesta) {
    return false;
  }

  const conditions = [
    eq(preventiviEventiTable.data_evento_richiesta, dataEventoRichiesta),
    eq(preventiviEventiTable.stato_evento, "confermato"),
  ];

  if (excludeId) {
    conditions.push(ne(preventiviEventiTable.id, excludeId));
  }

  const [existing] = await db
    .select({ id: preventiviEventiTable.id })
    .from(preventiviEventiTable)
    .where(and(...conditions));

  return Boolean(existing);
}

router.get("/public/quotes/:token", async (req, res) => {
  const [quote] = await db
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
      public_token: preventiviEventiTable.public_token,
      accepted_at: preventiviEventiTable.accepted_at,
      signature_name: preventiviEventiTable.signature_name,
      signature_svg: preventiviEventiTable.signature_svg,
      customer_ip: preventiviEventiTable.customer_ip,
      data_creazione: preventiviEventiTable.data_creazione,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, preventiviEventiTable.contatto_id))
    .where(eq(preventiviEventiTable.public_token, req.params.token));

  if (!quote) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(quote);
});

router.post("/public/quotes/:token/accept", async (req, res) => {
  const parsed = AcceptPublicQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      contatto_stato_lead: contattiCrmTable.stato_lead,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      budget_stimato: preventiviEventiTable.budget_stimato,
      accepted_at: preventiviEventiTable.accepted_at,
      stato_evento: preventiviEventiTable.stato_evento,
      event_stage: preventiviEventiTable.event_stage,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, preventiviEventiTable.contatto_id))
    .where(eq(preventiviEventiTable.public_token, req.params.token));

  if (!current) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (current.accepted_at) {
    res.status(409).json({ error: "Quote already accepted" });
    return;
  }

  if (await hasConfirmedDateConflict(current.data_evento_richiesta, current.id)) {
    res.status(409).json({ error: "Data non disponibile: esiste gia un evento confermato in questa data." });
    return;
  }

  const acceptedAt = new Date();
  const [updatedPreventivo] = await db
    .update(preventiviEventiTable)
    .set({
      accepted_at: acceptedAt,
      signature_name: parsed.data.signature_name.trim(),
      signature_svg: parsed.data.signature_svg?.trim() || null,
      customer_ip: req.ip,
      event_stage: "confirmed",
      stato_evento: "confermato",
    })
    .where(eq(preventiviEventiTable.id, current.id))
    .returning();

  const [existingPayment] = await db
    .select()
    .from(eventPaymentsTable)
    .where(and(
      eq(eventPaymentsTable.event_id, current.id),
      eq(eventPaymentsTable.payment_type, "acconto_1"),
    ));

  let paymentCreated = false;
  if (!existingPayment) {
    const budget = Number.parseFloat(current.budget_stimato ?? "0");
    await db.insert(eventPaymentsTable).values({
      event_id: current.id,
      payment_type: "acconto_1",
      amount: (Math.round(budget * 0.3 * 100) / 100).toFixed(2),
      due_date: acceptedAt.toISOString().slice(0, 10),
      status: "pending",
    });
    paymentCreated = true;
  }

  if (current.contatto_stato_lead !== "confermato") {
    await db
      .update(contattiCrmTable)
      .set({ stato_lead: "confermato", ultimo_contatto: acceptedAt })
      .where(eq(contattiCrmTable.id, current.contatto_id));

    await logLeadStatusChange({
      contattoId: current.contatto_id,
      previousStatus: current.contatto_stato_lead,
      nextStatus: "confermato",
      origine: "public_quote_accept",
      nota: `Preventivo ${current.id} accettato dal cliente da link pubblico`,
    });
  }

  await createSystemMessage({
    contattoId: current.contatto_id,
    testo: `Preventivo #${current.id} confermato digitalmente dal cliente${paymentCreated ? " - creato acconto 1" : ""}.`,
  });

  await syncLinkedAgendaForPreventivo({
    preventivoId: current.id,
    contattoId: current.contatto_id,
    contattoNome: current.contatto_nome,
    dataEvento: current.data_evento_richiesta,
  });
  await syncPreventivoToGoogle({ ...updatedPreventivo, contatto_nome: current.contatto_nome });

  await db.insert(auditLogTable).values({
    utente_id: null,
    utente_nome: "public_quote",
    azione: "accept",
    entita: "preventivo_pubblico",
    entita_id: current.id,
    dettagli: JSON.stringify({
      signature_name: parsed.data.signature_name.trim(),
      payment_created: paymentCreated,
    }),
    ip_address: req.ip,
    user_agent: req.header("user-agent") ?? null,
  });

  await notifyManagersAndAdmins({
    title: "Preventivo firmato dal cliente",
    message: `${current.contatto_nome ?? "Cliente"} ha confermato il preventivo ${current.id}.`,
    type: "success",
    link: `/events/${current.id}`,
  });

  res.json({
    preventivo: { ...updatedPreventivo, contatto_nome: current.contatto_nome },
    message: "Evento confermato con successo",
    payment_created: paymentCreated,
  });
});

export default router;
