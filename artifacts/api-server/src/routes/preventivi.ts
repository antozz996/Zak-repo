import { Router } from "express";
import { db, preventiviEventiTable, contattiCrmTable, preventiviVersioniTable, messaggiTable, insertPreventivoSchema, updatePreventivoSchema } from "@workspace/db";
import { eq, and, desc, ne, sql } from "drizzle-orm";
import { logAuditAction } from "../lib/audit-log";
import { CalculatePreventivoFoodCostBody, CalculatePreventivoPricingBody, ConfirmPreventivoDigitaleBody } from "@workspace/api-zod";
import { getWhatsAppConversationWindow } from "../lib/whatsapp-conversation-window";
import { sendWhatsAppTextSafely } from "../lib/whatsapp";
import { logWhatsAppOutbound } from "../lib/whatsapp-outbound-log";
import { logLeadStatusChange } from "../lib/lead-status-history";
import { deleteGoogleCalendarEvent, syncPreventivoToGoogle } from "../lib/google-calendar";
import { parseLimit, parseOffset } from "../lib/pagination";

const router = Router();

const pricingPackages = {
  essenziale: { descrizione: "Pacchetto Essenziale", prezzoPersona: 35, minimo: 1000 },
  standard: { descrizione: "Pacchetto Standard", prezzoPersona: 55, minimo: 1800 },
  premium: { descrizione: "Pacchetto Premium", prezzoPersona: 85, minimo: 3200 },
} as const;

const pricingExtras = {
  open_bar: { descrizione: "Open bar", prezzo: 12, tipo: "persona" },
  dj_set: { descrizione: "DJ set", prezzo: 450, tipo: "fisso" },
  fotografo: { descrizione: "Fotografo evento", prezzo: 600, tipo: "fisso" },
  allestimento: { descrizione: "Allestimento personalizzato", prezzo: 800, tipo: "fisso" },
  torta: { descrizione: "Torta evento", prezzo: 6, tipo: "persona" },
  sicurezza: { descrizione: "Servizio sicurezza", prezzo: 350, tipo: "fisso" },
} as const;

type PricingVoce = {
  codice: string;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
  totale: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatEuro(value: number) {
  return value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

function roundPercentage(value: number) {
  return Math.round(value * 10) / 10;
}

function getTipoEventoMultiplier(tipoEvento?: string) {
  if (tipoEvento === "matrimonio") return 1.15;
  if (tipoEvento === "aziendale") return 1.1;
  return 1;
}

function formatDateForMessage(date?: string | null) {
  if (!date) return "Da definire";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function buildPreventivoWhatsAppText(preventivo: {
  contatto_nome: string | null;
  tipo_evento: string | null;
  data_evento_richiesta: string | null;
  numero_invitati: number | null;
  budget_stimato: string | null;
  stato_evento: string;
}) {
  const budget = preventivo.budget_stimato
    ? formatEuro(Number.parseFloat(preventivo.budget_stimato))
    : "Da definire";
  return [
    `Ciao ${preventivo.contatto_nome ?? ""}, ecco il riepilogo del preventivo Zak:`,
    `Evento: ${preventivo.tipo_evento ?? "Da definire"}`,
    `Data: ${formatDateForMessage(preventivo.data_evento_richiesta)}`,
    `Invitati: ${preventivo.numero_invitati ?? "Da definire"}`,
    `Budget stimato: ${budget}`,
    `Stato: ${preventivo.stato_evento}`,
    "Rispondi a questo messaggio per confermare o chiedere modifiche.",
  ].join("\n");
}

function sanitizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatEuroForPdf(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "Da definire";
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(parsed)) return "Da definire";
  return `EUR ${parsed.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildPdfBuffer(lines: string[]) {
  const textCommands = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    `(${sanitizePdfText(lines[0] ?? "Preventivo Zak")}) Tj`,
    "/F1 11 Tf",
    "0 -30 Td",
    ...lines.slice(1, 34).flatMap((line) => [
      `(${sanitizePdfText(line).slice(0, 105)}) Tj`,
      "0 -16 Td",
    ]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(textCommands, "utf8")} >>\nstream\n${textCommands}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

function buildPreventivoPdf(preventivo: {
  id: string;
  contatto_nome: string | null;
  telefono: string | null;
  tipo_evento: string | null;
  data_evento_richiesta: string | null;
  numero_invitati: number | null;
  budget_stimato: string | null;
  stato_evento: string;
  note: string | null;
  data_creazione: Date | string;
}) {
  const noteLines = (preventivo.note ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  return buildPdfBuffer([
    "Preventivo Zak Ecosystem AI",
    "",
    `ID preventivo: ${preventivo.id}`,
    `Cliente: ${preventivo.contatto_nome ?? "Da definire"}`,
    `Telefono: ${preventivo.telefono ?? "Da definire"}`,
    `Tipo evento: ${preventivo.tipo_evento ?? "Da definire"}`,
    `Data evento: ${formatDateForMessage(preventivo.data_evento_richiesta)}`,
    `Numero invitati: ${preventivo.numero_invitati ?? "Da definire"}`,
    `Budget stimato: ${formatEuroForPdf(preventivo.budget_stimato)}`,
    `Stato preventivo: ${preventivo.stato_evento}`,
    `Data creazione: ${new Date(preventivo.data_creazione).toLocaleDateString("it-IT")}`,
    "",
    "Note operative:",
    ...(noteLines.length > 0 ? noteLines : ["Nessuna nota inserita."]),
    "",
    "Documento generato automaticamente dal CRM Zak.",
  ]);
}

function buildConfermaDigitaleNote(input: {
  firmatario_nome: string;
  firmatario_telefono?: string;
  metodo: string;
  note?: string;
}) {
  const parts = [
    `Conferma digitale registrata il ${new Date().toISOString()}`,
    `Firmatario: ${input.firmatario_nome}`,
    input.firmatario_telefono ? `Telefono firmatario: ${input.firmatario_telefono}` : null,
    `Metodo: ${input.metodo}`,
    input.note ? `Note conferma: ${input.note}` : null,
  ].filter(Boolean);
  return parts.join("\n");
}

async function hasConfirmedDateConflict(dataEventoRichiesta?: string, excludeId?: string) {
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

router.get("/preventivi", async (req, res) => {
  const { stato_evento, contatto_id, limit, offset } = req.query as Record<string, string | undefined>;
  const lim = parseLimit(limit, 200, 500);
  const off = parseOffset(offset);
  const conditions = [];
  if (stato_evento) conditions.push(eq(preventiviEventiTable.stato_evento, stato_evento));
  if (contatto_id) conditions.push(eq(preventiviEventiTable.contatto_id, contatto_id));

  const rows = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      data_creazione: preventiviEventiTable.data_creazione,
      google_calendar_id: preventiviEventiTable.google_calendar_id,
      google_event_id: preventiviEventiTable.google_event_id,
      google_sync_status: preventiviEventiTable.google_sync_status,
      google_last_synced_at: preventiviEventiTable.google_last_synced_at,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(preventiviEventiTable.data_creazione))
    .limit(lim)
    .offset(off);

  res.json(rows);
});

router.post("/preventivi", async (req, res) => {
  const parsed = insertPreventivoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.stato_evento === "confermato" && await hasConfirmedDateConflict(parsed.data.data_evento_richiesta || undefined)) {
    res.status(409).json({ error: "Data non disponibile: esiste gia un evento confermato in questa data." });
    return;
  }

  const [row] = await db.insert(preventiviEventiTable).values(parsed.data).returning();
  if (row.stato_evento === "confermato") {
    await syncPreventivoToGoogle({ ...row, contatto_nome: null });
  }
  await logAuditAction({ req, azione: "create", entita: "preventivo", entitaId: row.id, dettagli: { contatto_id: row.contatto_id, stato_evento: row.stato_evento } });
  res.status(201).json({ ...row, contatto_nome: null });
});

router.post("/preventivi/calcola-prezzo", (req, res) => {
  const parsed = CalculatePreventivoPricingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { pacchetto, tipo_evento } = parsed.data;
  const numeroInvitati = Math.trunc(parsed.data.numero_invitati);
  if (numeroInvitati <= 0 || numeroInvitati > 2000) {
    res.status(400).json({ error: "numero_invitati must be between 1 and 2000" });
    return;
  }

  const packageConfig = pricingPackages[pacchetto];
  const multiplier = getTipoEventoMultiplier(tipo_evento);
  const baseRaw = Math.max(numeroInvitati * packageConfig.prezzoPersona, packageConfig.minimo) * multiplier;
  const voci: PricingVoce[] = [
    {
      codice: `pacchetto_${pacchetto}`,
      descrizione: packageConfig.descrizione,
      quantita: numeroInvitati,
      prezzo_unitario: roundCurrency(packageConfig.prezzoPersona * multiplier),
      totale: roundCurrency(baseRaw),
    },
  ];

  for (const extraKey of parsed.data.extra ?? []) {
    const extra = pricingExtras[extraKey];
    const quantita = extra.tipo === "persona" ? numeroInvitati : 1;
    voci.push({
      codice: extraKey,
      descrizione: extra.descrizione,
      quantita,
      prezzo_unitario: extra.prezzo,
      totale: roundCurrency(extra.prezzo * quantita),
    });
  }

  const totale = roundCurrency(voci.reduce((sum, voce) => sum + voce.totale, 0));
  res.json({
    pacchetto,
    numero_invitati: numeroInvitati,
    voci,
    totale,
    totale_formattato: formatEuro(totale),
    note: multiplier > 1 ? "Maggiorazione applicata per tipologia evento." : "Prezzo calcolato da listino interno Zak.",
  });
});

router.post("/preventivi/calcola-food-cost", (req, res) => {
  const parsed = CalculatePreventivoFoodCostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    budget_previsto,
    costo_bevande_per_persona,
    costo_extra_fisso,
    costo_food_per_persona,
    percentuale_target,
  } = parsed.data;
  const numeroInvitati = Math.trunc(parsed.data.numero_invitati);

  if (numeroInvitati <= 0 || numeroInvitati > 2000) {
    res.status(400).json({ error: "numero_invitati must be between 1 and 2000" });
    return;
  }

  if (percentuale_target <= 0 || percentuale_target >= 100) {
    res.status(400).json({ error: "percentuale_target must be between 0 and 100" });
    return;
  }

  const costoVariabilePerPersona = roundCurrency(costo_food_per_persona + costo_bevande_per_persona);
  const costoVariabileTotale = roundCurrency(costoVariabilePerPersona * numeroInvitati);
  const costoTotale = roundCurrency(costoVariabileTotale + costo_extra_fisso);
  const prezzoMinimoTarget = roundCurrency(costoTotale / (percentuale_target / 100));

  const budgetPrevisto = budget_previsto ?? null;
  const foodCostPercentuale = budgetPrevisto && budgetPrevisto > 0
    ? roundPercentage((costoTotale / budgetPrevisto) * 100)
    : null;
  const margineLordo = budgetPrevisto && budgetPrevisto > 0
    ? roundCurrency(budgetPrevisto - costoTotale)
    : null;
  const marginePerPersona = margineLordo !== null
    ? roundCurrency(margineLordo / numeroInvitati)
    : null;
  const ricavoMedioPersona = budgetPrevisto && budgetPrevisto > 0
    ? roundCurrency(budgetPrevisto / numeroInvitati)
    : null;

  res.json({
    numero_invitati: numeroInvitati,
    budget_previsto: budgetPrevisto,
    costo_food_per_persona: roundCurrency(costo_food_per_persona),
    costo_bevande_per_persona: roundCurrency(costo_bevande_per_persona),
    costo_variabile_per_persona: costoVariabilePerPersona,
    costo_variabile_totale: costoVariabileTotale,
    costo_extra_fisso: roundCurrency(costo_extra_fisso),
    costo_totale: costoTotale,
    food_cost_percentuale: foodCostPercentuale,
    margine_lordo: margineLordo,
    margine_per_persona: marginePerPersona,
    ricavo_medio_persona: ricavoMedioPersona,
    prezzo_minimo_target: prezzoMinimoTarget,
    percentuale_target: roundPercentage(percentuale_target),
    note: budgetPrevisto && budgetPrevisto > 0
      ? `Con budget ${formatEuro(budgetPrevisto)}, il food cost incide per ${foodCostPercentuale}% e il margine lordo stimato e' ${formatEuro(margineLordo ?? 0)}.`
      : `Per mantenere un food cost al ${roundPercentage(percentuale_target)}%, il prezzo minimo consigliato e' ${formatEuro(prezzoMinimoTarget)}.`,
  });
});

router.post("/preventivi/:id/invia-whatsapp", async (req, res) => {
  const [preventivo] = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      telefono: contattiCrmTable.telefono,
      tipo_evento: contattiCrmTable.tipo_evento,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      stato_evento: preventiviEventiTable.stato_evento,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(eq(preventiviEventiTable.id, req.params.id));

  if (!preventivo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (!preventivo.telefono) {
    res.status(400).json({ error: "Contatto senza telefono WhatsApp valido" });
    return;
  }

  const testo = buildPreventivoWhatsAppText(preventivo);
  const window = await getWhatsAppConversationWindow(preventivo.contatto_id);
  if (!window.isOpen) {
    const result = { status: "skipped" as const, reason: "WhatsApp 24-hour conversation window closed" };
    await logWhatsAppOutbound({
      contattoId: preventivo.contatto_id,
      telefono: preventivo.telefono,
      sorgente: "preventivo_whatsapp",
      testo,
      result,
    });
    res.json({
      success: false,
      status: result.status,
      message: result.reason,
      provider_message_id: null,
    });
    return;
  }

  await db.insert(messaggiTable).values({
    contatto_id: preventivo.contatto_id,
    canale: "whatsapp",
    direzione: "outbound",
    testo,
    mittente_nome: "Staff",
  });
  await db
    .update(contattiCrmTable)
    .set({ ultimo_contatto: new Date() })
    .where(eq(contattiCrmTable.id, preventivo.contatto_id));

  const result = await sendWhatsAppTextSafely({
    to: preventivo.telefono,
    text: testo,
  });
  await logWhatsAppOutbound({
    contattoId: preventivo.contatto_id,
    telefono: preventivo.telefono,
    sorgente: "preventivo_whatsapp",
    testo,
    result,
  });
  await logAuditAction({
    req,
    azione: "send",
    entita: "preventivo",
    entitaId: preventivo.id,
    dettagli: { canale: "whatsapp", stato_invio: result.status },
  });

  res.json({
    success: result.status === "sent",
    status: result.status,
    message: result.status === "sent" ? "Preventivo inviato via WhatsApp" : result.reason,
    provider_message_id: result.status === "sent" ? result.providerMessageId ?? null : null,
  });
});

router.post("/preventivi/:id/conferma-digitale", async (req, res) => {
  const parsed = ConfirmPreventivoDigitaleBody.safeParse(req.body);
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
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      data_creazione: preventiviEventiTable.data_creazione,
      google_calendar_id: preventiviEventiTable.google_calendar_id,
      google_event_id: preventiviEventiTable.google_event_id,
      google_sync_status: preventiviEventiTable.google_sync_status,
      google_last_synced_at: preventiviEventiTable.google_last_synced_at,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(eq(preventiviEventiTable.id, req.params.id));

  if (!current) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (current.data_evento_richiesta && await hasConfirmedDateConflict(current.data_evento_richiesta, req.params.id)) {
    res.status(409).json({ error: "Data non disponibile: esiste gia un evento confermato in questa data." });
    return;
  }

  const confirmationNote = buildConfermaDigitaleNote(parsed.data);
  const nextNote = [current.note, confirmationNote].filter(Boolean).join("\n\n");

  const [updatedPreventivo] = await db
    .update(preventiviEventiTable)
    .set({
      stato_evento: "confermato",
      note: nextNote,
    })
    .where(eq(preventiviEventiTable.id, req.params.id))
    .returning();

  await syncPreventivoToGoogle({ ...updatedPreventivo, contatto_nome: current.contatto_nome });

  if (current.contatto_stato_lead !== "confermato") {
    await db
      .update(contattiCrmTable)
      .set({ stato_lead: "confermato", ultimo_contatto: new Date() })
      .where(eq(contattiCrmTable.id, current.contatto_id));
    await logLeadStatusChange({
      contattoId: current.contatto_id,
      previousStatus: current.contatto_stato_lead,
      nextStatus: "confermato",
      origine: "conferma_digitale_preventivo",
      nota: `Preventivo ${req.params.id} confermato digitalmente`,
    });
  }

  await logAuditAction({
    req,
    azione: "confirm",
    entita: "preventivo",
    entitaId: req.params.id,
    dettagli: {
      metodo: parsed.data.metodo,
      firmatario_nome: parsed.data.firmatario_nome,
    },
  });

  res.json({
    preventivo: {
      ...updatedPreventivo,
      contatto_nome: current.contatto_nome,
    },
    message: "Preventivo confermato digitalmente",
  });
});

router.get("/preventivi/:id/versioni", async (req, res) => {
  const rows = await db
    .select()
    .from(preventiviVersioniTable)
    .where(eq(preventiviVersioniTable.preventivo_id, req.params.id))
    .orderBy(desc(preventiviVersioniTable.numero_versione));

  res.json(rows);
});

router.post("/preventivi/:id/versioni", async (req, res) => {
  const nota = typeof req.body?.nota === "string" && req.body.nota.trim() ? req.body.nota.trim() : null;
  const [preventivo] = await db
    .select()
    .from(preventiviEventiTable)
    .where(eq(preventiviEventiTable.id, req.params.id));

  if (!preventivo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [versioneCorrente] = await db
    .select({
      numero_versione: sql<number>`COALESCE(MAX(${preventiviVersioniTable.numero_versione}), 0)::int`,
    })
    .from(preventiviVersioniTable)
    .where(eq(preventiviVersioniTable.preventivo_id, req.params.id));

  const [row] = await db
    .insert(preventiviVersioniTable)
    .values({
      preventivo_id: req.params.id,
      numero_versione: Number(versioneCorrente?.numero_versione ?? 0) + 1,
      snapshot: {
        id: preventivo.id,
        contatto_id: preventivo.contatto_id,
        data_evento_richiesta: preventivo.data_evento_richiesta,
        numero_invitati: preventivo.numero_invitati,
        budget_stimato: preventivo.budget_stimato,
        note: preventivo.note,
        stato_evento: preventivo.stato_evento,
        data_creazione: preventivo.data_creazione,
      },
      nota,
    })
    .returning();

  await logAuditAction({
    req,
    azione: "create",
    entita: "preventivo_versione",
    entitaId: row.id,
    dettagli: { preventivo_id: req.params.id, numero_versione: row.numero_versione },
  });
  res.status(201).json(row);
});

router.get("/preventivi/:id/pdf", async (req, res) => {
  const [preventivo] = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      telefono: contattiCrmTable.telefono,
      tipo_evento: contattiCrmTable.tipo_evento,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      data_creazione: preventiviEventiTable.data_creazione,
      google_calendar_id: preventiviEventiTable.google_calendar_id,
      google_event_id: preventiviEventiTable.google_event_id,
      google_sync_status: preventiviEventiTable.google_sync_status,
      google_last_synced_at: preventiviEventiTable.google_last_synced_at,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(eq(preventiviEventiTable.id, req.params.id));

  if (!preventivo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const pdf = buildPreventivoPdf(preventivo);
  await logAuditAction({
    req,
    azione: "download",
    entita: "preventivo_pdf",
    entitaId: preventivo.id,
    dettagli: { contatto_id: preventivo.contatto_id },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="preventivo-${preventivo.id}.pdf"`);
  res.send(pdf);
});

router.get("/preventivi/:id", async (req, res) => {
  const [row] = await db
    .select({
      id: preventiviEventiTable.id,
      contatto_id: preventiviEventiTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
      data_evento_richiesta: preventiviEventiTable.data_evento_richiesta,
      numero_invitati: preventiviEventiTable.numero_invitati,
      budget_stimato: preventiviEventiTable.budget_stimato,
      note: preventiviEventiTable.note,
      stato_evento: preventiviEventiTable.stato_evento,
      data_creazione: preventiviEventiTable.data_creazione,
    })
    .from(preventiviEventiTable)
    .leftJoin(contattiCrmTable, eq(preventiviEventiTable.contatto_id, contattiCrmTable.id))
    .where(eq(preventiviEventiTable.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.patch("/preventivi/:id", async (req, res) => {
  const parsed = updatePreventivoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db
    .select()
    .from(preventiviEventiTable)
    .where(eq(preventiviEventiTable.id, req.params.id));

  if (!current) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const nextState = parsed.data.stato_evento ?? current.stato_evento;
  const nextDate = parsed.data.data_evento_richiesta ?? current.data_evento_richiesta ?? undefined;

  if (nextState === "confermato" && await hasConfirmedDateConflict(nextDate, req.params.id)) {
    res.status(409).json({ error: "Data non disponibile: esiste gia un evento confermato in questa data." });
    return;
  }

  const [row] = await db.update(preventiviEventiTable).set(parsed.data).where(eq(preventiviEventiTable.id, req.params.id)).returning();
  if (row.stato_evento === "confermato") {
    await syncPreventivoToGoogle({ ...row, contatto_nome: null });
  }
  await logAuditAction({ req, azione: "update", entita: "preventivo", entitaId: row.id, dettagli: parsed.data });
  res.json({ ...row, contatto_nome: null });
});

router.delete("/preventivi/:id", async (req, res) => {
  const [existing] = await db.select().from(preventiviEventiTable).where(eq(preventiviEventiTable.id, req.params.id));
  await deleteGoogleCalendarEvent(existing?.google_event_id);
  await db.delete(preventiviEventiTable).where(eq(preventiviEventiTable.id, req.params.id));
  await logAuditAction({ req, azione: "delete", entita: "preventivo", entitaId: req.params.id });
  res.status(204).send();
});

export default router;
