import { and, desc, eq } from "drizzle-orm";
import {
  contattiCrmTable,
  automazioniConfigTable,
  bookingConversationStateTable,
  db,
  messaggiTable,
  preventiviEventiTable,
  type Contatto,
  type Preventivo,
} from "@workspace/db";
import { sendWhatsAppTextSafely } from "./whatsapp";
import { logLeadStatusChange } from "./lead-status-history";
import { logWhatsAppOutbound } from "./whatsapp-outbound-log";
import { getWhatsAppConversationWindow } from "./whatsapp-conversation-window";
import { checkGoogleCalendarAvailability } from "./google-calendar";
import {
  extractDataEvento,
  extractNome,
  extractNumeroInvitati,
  extractTipoEvento,
  formatDateForReply,
  getCurrentBookingStep,
  getMissingBookingSteps,
  isHandoffRequest,
  renderTemplate,
} from "./booking-assistant-parser";
import { extractBookingDataWithLlm } from "./llm-booking-extractor";

type BookingAssistantResult = {
  contatto: Contatto;
  preventivo: Preventivo | null;
  risposta: string | null;
  datiEstratti: {
    nome?: string;
    tipo_evento?: string;
    data_evento_richiesta?: string;
    numero_invitati?: number;
    budget_stimato?: number;
    preferenze?: string[];
    handoff_richiesto?: boolean;
    livello_confidenza?: string;
    origine?: "llm" | "rule_based";
  };
};

const bookingAssistantTemplateDefaults = [
  {
    chiave: "booking_assistant_template_nome",
    valore: "Ciao! Sono Zak AI. Per iniziare, come ti chiami?",
    descrizione: "Risposta quando manca il nome del lead. Placeholder disponibili: {{nome}}.",
  },
  {
    chiave: "booking_assistant_template_tipo_evento",
    valore: "Piacere {{nome}}! Che tipo di evento vuoi organizzare? Ad esempio compleanno, laurea, diciottesimo, matrimonio o aziendale.",
    descrizione: "Risposta quando manca il tipo evento. Placeholder disponibili: {{nome}}.",
  },
  {
    chiave: "booking_assistant_template_data_evento",
    valore: "Perfetto {{nome}}. Che data hai in mente per il tuo {{tipo_evento}}? Puoi scriverla anche come 14/09/2026.",
    descrizione: "Risposta quando manca la data evento. Placeholder disponibili: {{nome}}, {{tipo_evento}}.",
  },
  {
    chiave: "booking_assistant_template_numero_invitati",
    valore: "Ottimo. Quanti invitati prevedi circa?",
    descrizione: "Risposta quando manca il numero invitati.",
  },
  {
    chiave: "booking_assistant_template_completo",
    valore: "Perfetto {{nome}}, ho raccolto tutte le informazioni principali per il tuo {{tipo_evento}} del {{data_evento}} per circa {{numero_invitati}} invitati. Ti ricontatteremo presto con i dettagli.",
    descrizione: "Risposta finale quando il lead e qualificato. Placeholder: {{nome}}, {{tipo_evento}}, {{data_evento}}, {{numero_invitati}}.",
  },
  {
    chiave: "booking_assistant_template_handoff",
    valore: "Va bene, ti passo allo staff. Un operatore Zak riprendera la conversazione appena possibile.",
    descrizione: "Risposta quando il cliente chiede un operatore umano.",
  },
  {
    chiave: "booking_assistant_template_data_occupata",
    valore: "La data {{data_evento}} risulta gia occupata.{{alternative}} Dimmi quale preferisci oppure scrivimi un'altra data.",
    descrizione: "Risposta quando la data richiesta e occupata. Placeholder: {{data_evento}}, {{alternative}}.",
  },
  {
    chiave: "booking_assistant_template_data_disponibile",
    valore: "Ottimo, il {{data_evento}} risulta disponibile. Quanti invitati prevedi circa?",
    descrizione: "Risposta quando la data e disponibile ma mancano gli invitati. Placeholder: {{data_evento}}.",
  },
];

type BookingAssistantTemplates = Record<(typeof bookingAssistantTemplateDefaults)[number]["chiave"], string>;

async function ensureBookingAssistantTemplateDefaults() {
  for (const config of bookingAssistantTemplateDefaults) {
    await db.insert(automazioniConfigTable).values(config).onConflictDoNothing();
  }
}

async function getBookingAssistantTemplates(): Promise<BookingAssistantTemplates> {
  await ensureBookingAssistantTemplateDefaults();
  const rows = await db
    .select()
    .from(automazioniConfigTable)
    .where(eq(automazioniConfigTable.chiave, "booking_assistant_template_nome"));
  const firstTemplate = rows[0];

  // If the first key exists, read all keys in one pass. The preliminary read keeps old DBs safe after onConflictDoNothing.
  const allRows = firstTemplate
    ? await db.select().from(automazioniConfigTable)
    : [];
  const values = new Map(allRows.map((row) => [row.chiave, row.valore]));

  return Object.fromEntries(
    bookingAssistantTemplateDefaults.map((template) => [template.chiave, values.get(template.chiave) ?? template.valore]),
  ) as BookingAssistantTemplates;
}

async function getOrCreateOpenPreventivo(contattoId: string): Promise<Preventivo> {
  const [existing] = await db
    .select()
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.contatto_id, contattoId), eq(preventiviEventiTable.stato_evento, "opzionato")))
    .orderBy(desc(preventiviEventiTable.data_creazione))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(preventiviEventiTable)
    .values({
      contatto_id: contattoId,
      stato_evento: "opzionato",
      note: "Creato automaticamente dal booking assistant",
    })
    .returning();

  return created;
}

async function checkAvailability(dataEvento: string): Promise<{ disponibile: boolean; alternative: string[] }> {
  const [existing] = await db
    .select()
    .from(preventiviEventiTable)
    .where(and(eq(preventiviEventiTable.data_evento_richiesta, dataEvento), eq(preventiviEventiTable.stato_evento, "confermato")));

  const googleAvailability = !existing ? await checkGoogleCalendarAvailability({ data: dataEvento }) : null;
  if (!existing && (!googleAvailability || googleAvailability.slotDisponibili.length > 0)) {
    return { disponibile: true, alternative: [] };
  }

  const alternative: string[] = [];
  const baseDate = new Date(dataEvento);
  let checked = 0;
  let offset = 1;

  while (alternative.length < 3 && checked < 90) {
    const candidate = new Date(baseDate);
    candidate.setDate(candidate.getDate() + offset);
    const day = candidate.getDay();
    if (day === 5 || day === 0) {
      const candidateStr = candidate.toISOString().split("T")[0];
      const [conflict] = await db
        .select()
        .from(preventiviEventiTable)
        .where(and(eq(preventiviEventiTable.data_evento_richiesta, candidateStr), eq(preventiviEventiTable.stato_evento, "confermato")));
      if (!conflict) {
        const googleCandidateAvailability = await checkGoogleCalendarAvailability({ data: candidateStr });
        if (!googleCandidateAvailability || googleCandidateAvailability.slotDisponibili.length > 0) {
          alternative.push(candidateStr);
        }
      }
    }
    offset++;
    checked++;
  }

  return { disponibile: false, alternative };
}

function buildNextQuestion(contatto: Contatto, preventivo: Preventivo, templates: BookingAssistantTemplates): string {
  const variables = {
    nome: contatto.nome,
    tipo_evento: contatto.tipo_evento,
    data_evento: preventivo.data_evento_richiesta ? formatDateForReply(preventivo.data_evento_richiesta) : "",
    numero_invitati: preventivo.numero_invitati ?? "",
  };

  if (!contatto.nome || contatto.nome === "Sconosciuto") {
    return renderTemplate(templates.booking_assistant_template_nome, variables);
  }

  if (!contatto.tipo_evento) {
    return renderTemplate(templates.booking_assistant_template_tipo_evento, variables);
  }

  if (!preventivo.data_evento_richiesta) {
    return renderTemplate(templates.booking_assistant_template_data_evento, variables);
  }

  if (!preventivo.numero_invitati) {
    return renderTemplate(templates.booking_assistant_template_numero_invitati, variables);
  }

  return renderTemplate(templates.booking_assistant_template_completo, variables);
}

async function persistConversationState(params: {
  contatto: Contatto;
  preventivo: Preventivo | null;
  datiEstratti: BookingAssistantResult["datiEstratti"];
}) {
  const snapshot = {
    nome: params.contatto.nome,
    tipo_evento: params.contatto.tipo_evento,
    data_evento_richiesta: params.preventivo?.data_evento_richiesta,
    numero_invitati: params.preventivo?.numero_invitati,
    handoff_richiesto: params.contatto.handoff_richiesto,
  };
  const stepCorrente = getCurrentBookingStep(snapshot);
  const missingSteps = getMissingBookingSteps(snapshot);
  const now = new Date();
  const values = {
    contatto_id: params.contatto.id,
    step_corrente: stepCorrente,
    dati_mancanti: missingSteps.filter((step) => step !== "handoff").join(","),
    dati_estratti_json: JSON.stringify(params.datiEstratti),
    completato: stepCorrente === "completo",
    ultimo_messaggio_at: now,
    data_aggiornamento: now,
  };

  await db
    .insert(bookingConversationStateTable)
    .values(values)
    .onConflictDoUpdate({
      target: bookingConversationStateTable.contatto_id,
      set: values,
    });
}

async function saveAssistantMessage(contatto: Contatto, testo: string) {
  await db.insert(messaggiTable).values({
    contatto_id: contatto.id,
    canale: "whatsapp",
    direzione: "outbound",
    testo,
    mittente_nome: "Zak AI",
  });

  const window = await getWhatsAppConversationWindow(contatto.id);
  const result = window.isOpen
    ? await sendWhatsAppTextSafely({
        to: contatto.telefono,
        text: testo,
      })
    : { status: "skipped" as const, reason: "WhatsApp 24-hour conversation window expired" };
  await logWhatsAppOutbound({
    contattoId: contatto.id,
    telefono: contatto.telefono,
    sorgente: "booking_assistant",
    testo,
    result,
  });
}

export async function processBookingAssistantMessage(input: {
  contatto: Contatto;
  testo: string;
}): Promise<BookingAssistantResult> {
  const datiEstratti: BookingAssistantResult["datiEstratti"] = {};
  const templates = await getBookingAssistantTemplates();

  if (input.contatto.handoff_richiesto) {
    await db
      .update(contattiCrmTable)
      .set({ ultimo_contatto: new Date() })
      .where(eq(contattiCrmTable.id, input.contatto.id));
    await persistConversationState({
      contatto: input.contatto,
      preventivo: null,
      datiEstratti,
    });
    return { contatto: input.contatto, preventivo: null, risposta: null, datiEstratti };
  }

  const llmExtraction = await extractBookingDataWithLlm({
    testo: input.testo,
    contesto: {
      contatto: {
        nome: input.contatto.nome,
        tipo_evento: input.contatto.tipo_evento,
        stato_lead: input.contatto.stato_lead,
      },
    },
  });

  if (llmExtraction) {
    datiEstratti.origine = "llm";
    datiEstratti.handoff_richiesto = llmExtraction.handoff_richiesto;
    datiEstratti.livello_confidenza = llmExtraction.livello_confidenza;
    if (llmExtraction.preferenze.length > 0) datiEstratti.preferenze = llmExtraction.preferenze;
  } else {
    datiEstratti.origine = "rule_based";
  }

  if (isHandoffRequest(input.testo) || llmExtraction?.handoff_richiesto) {
    const [updated] = await db
      .update(contattiCrmTable)
      .set({
        handoff_richiesto: true,
        ultimo_contatto: new Date(),
      })
      .where(eq(contattiCrmTable.id, input.contatto.id))
      .returning();
    const contatto = updated ?? input.contatto;
    const risposta = renderTemplate(templates.booking_assistant_template_handoff, { nome: contatto.nome });
    await saveAssistantMessage(contatto, risposta);
    await persistConversationState({
      contatto,
      preventivo: null,
      datiEstratti,
    });
    return { contatto, preventivo: null, risposta, datiEstratti };
  }

  const nome = llmExtraction?.nome ?? extractNome(input.testo);
  const tipoEvento = llmExtraction?.tipo_evento ?? extractTipoEvento(input.testo);
  const dataEvento = llmExtraction?.data_evento_richiesta ?? extractDataEvento(input.testo);
  const numeroInvitati = llmExtraction?.numero_invitati ?? extractNumeroInvitati(input.testo);
  const budgetStimato = llmExtraction?.budget_stimato;

  if (nome) datiEstratti.nome = nome;
  if (tipoEvento) datiEstratti.tipo_evento = tipoEvento;
  if (dataEvento) datiEstratti.data_evento_richiesta = dataEvento;
  if (numeroInvitati) datiEstratti.numero_invitati = numeroInvitati;
  if (budgetStimato) datiEstratti.budget_stimato = budgetStimato;

  const contattoUpdate: Partial<Contatto> = {
    ultimo_contatto: new Date(),
  };

  if ((!input.contatto.nome || input.contatto.nome === "Sconosciuto") && nome) {
    contattoUpdate.nome = nome;
  }
  if (!input.contatto.tipo_evento && tipoEvento) {
    contattoUpdate.tipo_evento = tipoEvento;
  }
  if (nome || tipoEvento || dataEvento || numeroInvitati) {
    contattoUpdate.stato_lead = "in_trattativa";
  }

  let contatto = input.contatto;
  if (Object.keys(contattoUpdate).length > 0) {
    const previousStatus = contatto.stato_lead;
    const [updated] = await db
      .update(contattiCrmTable)
      .set(contattoUpdate)
      .where(eq(contattiCrmTable.id, input.contatto.id))
      .returning();
    if (updated) {
      contatto = updated;
      await logLeadStatusChange({
        contattoId: updated.id,
        previousStatus,
        nextStatus: updated.stato_lead,
        origine: "booking_assistant",
        nota: "Qualificazione automatica lead da chat WhatsApp",
      });
    }
  }

  let preventivo = await getOrCreateOpenPreventivo(contatto.id);
  const preventivoUpdate: Partial<Preventivo> = {};

  if (!preventivo.data_evento_richiesta && dataEvento) {
    preventivoUpdate.data_evento_richiesta = dataEvento;
  }
  if (!preventivo.numero_invitati && numeroInvitati) {
    preventivoUpdate.numero_invitati = numeroInvitati;
  }
  if (!preventivo.budget_stimato && budgetStimato) {
    preventivoUpdate.budget_stimato = String(budgetStimato);
  }

  const noteParts = [
    preventivo.note,
    nome ? `Nome rilevato in chat: ${nome}` : null,
    tipoEvento ? `Tipo evento rilevato: ${tipoEvento}` : null,
    llmExtraction?.preferenze.length ? `Preferenze rilevate: ${llmExtraction.preferenze.join(", ")}` : null,
    llmExtraction ? `Estrazione LLM: confidenza ${llmExtraction.livello_confidenza}` : null,
  ].filter(Boolean);

  if (noteParts.length > 0) {
    preventivoUpdate.note = Array.from(new Set(noteParts)).join("\n");
  }

  if (Object.keys(preventivoUpdate).length > 0) {
    const [updatedPreventivo] = await db
      .update(preventiviEventiTable)
      .set(preventivoUpdate)
      .where(eq(preventiviEventiTable.id, preventivo.id))
      .returning();
    if (updatedPreventivo) preventivo = updatedPreventivo;
  }

  let risposta = buildNextQuestion(contatto, preventivo, templates);

  if (dataEvento && preventivo.data_evento_richiesta === dataEvento) {
    const availability = await checkAvailability(dataEvento);
    if (!availability.disponibile) {
      const alternativeText = availability.alternative.length > 0
        ? ` Ti posso proporre queste alternative: ${availability.alternative.map(formatDateForReply).join(", ")}.`
        : "";
      risposta = renderTemplate(templates.booking_assistant_template_data_occupata, {
        data_evento: formatDateForReply(dataEvento),
        alternative: alternativeText,
      });
      await db
        .update(preventiviEventiTable)
        .set({ data_evento_richiesta: null })
        .where(eq(preventiviEventiTable.id, preventivo.id));
      preventivo = { ...preventivo, data_evento_richiesta: null };
    } else if (!preventivo.numero_invitati) {
      risposta = renderTemplate(templates.booking_assistant_template_data_disponibile, {
        data_evento: formatDateForReply(dataEvento),
      });
    }
  }

  if (risposta) {
    await saveAssistantMessage(contatto, risposta);
  }

  await persistConversationState({
    contatto,
    preventivo,
    datiEstratti,
  });

  return {
    contatto,
    preventivo,
    risposta,
    datiEstratti,
  };
}
