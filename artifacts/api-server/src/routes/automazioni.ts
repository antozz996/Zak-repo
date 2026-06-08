import { Router } from "express";
import { db, agendaPersonaleTable, automazioniLogTable, automazioniConfigTable, contattiCrmTable, messaggiTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { sendWhatsAppTemplateSafely, sendWhatsAppTextSafely } from "../lib/whatsapp";
import { logWhatsAppOutbound } from "../lib/whatsapp-outbound-log";
import { getWhatsAppConversationWindow } from "../lib/whatsapp-conversation-window";
import { logAuditAction } from "../lib/audit-log";

const router = Router();

const defaultAutomationConfigs = [
  {
    chiave: "reengagement_attivo",
    valore: "true",
    descrizione: "Abilita il job automatico di re-engagement lead persi.",
  },
  {
    chiave: "reengagement_mesi",
    valore: "3",
    descrizione: "Mesi minimi di inattivita prima di ricontattare un lead perso.",
  },
  {
    chiave: "ricorrenza_attiva",
    valore: "true",
    descrizione: "Abilita il job automatico di fidelizzazione ricorrenze.",
  },
  {
    chiave: "ricorrenza_mesi_anticipo",
    valore: "10",
    descrizione: "Mesi di anticipo con cui proporre la ricorrenza dell'anno successivo.",
  },
  {
    chiave: "reengagement_tipi_evento",
    valore: "all",
    descrizione: "Tipi evento abilitati al re-engagement, separati da virgola. Usa all per includerli tutti.",
  },
  {
    chiave: "ricorrenza_tipi_evento",
    valore: "all",
    descrizione: "Tipi evento abilitati alle ricorrenze annuali, separati da virgola. Usa all per includerli tutti.",
  },
  {
    chiave: "promemoria_attivo",
    valore: "true",
    descrizione: "Abilita il job interno di promemoria agenda.",
  },
  {
    chiave: "promemoria_minuti_anticipo",
    valore: "60",
    descrizione: "Minuti di anticipo con cui registrare i promemoria agenda imminenti.",
  },
  {
    chiave: "booking_assistant_template_nome",
    valore: "Ciao! Sono Zak AI. Per iniziare, come ti chiami?",
    descrizione: "Template Booking Assistant quando manca il nome. Placeholder: {{nome}}.",
  },
  {
    chiave: "booking_assistant_template_tipo_evento",
    valore: "Piacere {{nome}}! Che tipo di evento vuoi organizzare? Ad esempio compleanno, laurea, diciottesimo, matrimonio o aziendale.",
    descrizione: "Template Booking Assistant quando manca il tipo evento. Placeholder: {{nome}}.",
  },
  {
    chiave: "booking_assistant_template_data_evento",
    valore: "Perfetto {{nome}}. Che data hai in mente per il tuo {{tipo_evento}}? Puoi scriverla anche come 14/09/2026.",
    descrizione: "Template Booking Assistant quando manca la data evento. Placeholder: {{nome}}, {{tipo_evento}}.",
  },
  {
    chiave: "booking_assistant_template_numero_invitati",
    valore: "Ottimo. Quanti invitati prevedi circa?",
    descrizione: "Template Booking Assistant quando manca il numero invitati.",
  },
  {
    chiave: "booking_assistant_template_completo",
    valore: "Perfetto {{nome}}, ho raccolto tutte le informazioni principali per il tuo {{tipo_evento}} del {{data_evento}} per circa {{numero_invitati}} invitati. Ti ricontatteremo presto con i dettagli.",
    descrizione: "Template Booking Assistant quando il lead e qualificato. Placeholder: {{nome}}, {{tipo_evento}}, {{data_evento}}, {{numero_invitati}}.",
  },
  {
    chiave: "booking_assistant_template_handoff",
    valore: "Va bene, ti passo allo staff. Un operatore Zak riprendera la conversazione appena possibile.",
    descrizione: "Template Booking Assistant quando il cliente chiede un operatore umano.",
  },
  {
    chiave: "booking_assistant_template_data_occupata",
    valore: "La data {{data_evento}} risulta gia occupata.{{alternative}} Dimmi quale preferisci oppure scrivimi un'altra data.",
    descrizione: "Template Booking Assistant quando la data richiesta e occupata. Placeholder: {{data_evento}}, {{alternative}}.",
  },
  {
    chiave: "booking_assistant_template_data_disponibile",
    valore: "Ottimo, il {{data_evento}} risulta disponibile. Quanti invitati prevedi circa?",
    descrizione: "Template Booking Assistant quando la data e disponibile ma mancano gli invitati. Placeholder: {{data_evento}}.",
  },
];

async function ensureAutomationConfigDefaults() {
  for (const config of defaultAutomationConfigs) {
    await db.insert(automazioniConfigTable).values(config).onConflictDoNothing();
  }
}

async function getConfigValue(chiave: string, fallback: string): Promise<string> {
  await ensureAutomationConfigDefaults();
  const [row] = await db.select().from(automazioniConfigTable).where(eq(automazioniConfigTable.chiave, chiave));
  return row?.valore ?? fallback;
}

function parseTipiEventoConfig(value: string): Set<string> | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "all" || normalized === "tutti" || normalized === "*") {
    return null;
  }

  const values = normalized
    .split(/[,\n;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? new Set(values) : null;
}

function matchesTipoEvento(tipoEvento: string | null | undefined, allowed: Set<string> | null) {
  if (!allowed) return true;
  return allowed.has((tipoEvento ?? "").trim().toLowerCase());
}

function normalizeConfigValue(chiave: string, valore: unknown): string | null {
  const raw = String(valore ?? "").trim();
  if (!raw) return null;

  if (["reengagement_attivo", "ricorrenza_attiva", "promemoria_attivo"].includes(chiave)) {
    const normalized = raw.toLowerCase();
    return ["true", "false"].includes(normalized) ? normalized : null;
  }

  if (["reengagement_mesi", "ricorrenza_mesi_anticipo"].includes(chiave)) {
    const months = parseInt(raw, 10);
    return Number.isInteger(months) && months >= 1 && months <= 60 ? String(months) : null;
  }

  if (chiave === "promemoria_minuti_anticipo") {
    const minutes = parseInt(raw, 10);
    return Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440 ? String(minutes) : null;
  }

  if (["reengagement_tipi_evento", "ricorrenza_tipi_evento"].includes(chiave)) {
    const normalized = raw
      .toLowerCase()
      .split(/[,\n;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (normalized.length === 0) return null;
    if (normalized.includes("all") || normalized.includes("tutti") || normalized.includes("*")) return "all";
    return Array.from(new Set(normalized)).join(",");
  }

  return raw;
}

async function isConfigEnabled(chiave: string, fallback = true): Promise<boolean> {
  const value = await getConfigValue(chiave, fallback ? "true" : "false");
  return value.toLowerCase() === "true";
}

async function logAutomazione(tipo: string, contatto_id: string | null, contatto_nome: string | null, messaggio: string, stato = "eseguito") {
  await db.insert(automazioniLogTable).values({ tipo, contatto_id, contatto_nome, messaggio, stato });
}

function createPerformanceBucket(tipo: string) {
  return { tipo, totale: 0, eseguiti: 0, saltati: 0, errori: 0 };
}

async function inviaMessaggioAutomazione(input: {
  tipo: "reengagement" | "ricorrenza";
  contattoId: string;
  contattoNome: string;
  telefono: string | null;
  testo: string;
  templateName?: string;
  templateParameters?: string[];
}) {
  if (!input.telefono) {
    await logAutomazione(input.tipo, input.contattoId, input.contattoNome, `Invio non eseguito: telefono mancante per ${input.contattoNome}`, "errore");
    return { stato: "errore" as const, dettagli: `Telefono mancante per ${input.contattoNome}` };
  }

  const hasTemplate = Boolean(input.templateName);
  const window = hasTemplate ? null : await getWhatsAppConversationWindow(input.contattoId);

  if (!hasTemplate && !window?.isOpen) {
    const result = { status: "skipped" as const, reason: "WhatsApp 24-hour conversation window expired and no approved template is configured" };
    await logWhatsAppOutbound({
      contattoId: input.contattoId,
      telefono: input.telefono,
      sorgente: `automazione_${input.tipo}_outside_24h`,
      testo: input.testo,
      result,
    });
    await logAutomazione(
      input.tipo,
      input.contattoId,
      input.contattoNome,
      `Invio saltato: finestra WhatsApp 24 ore chiusa e template Meta non configurato per ${input.contattoNome}`,
      "saltato",
    );
    return { stato: "saltato" as const, dettagli: `Invio saltato per ${input.contattoNome}: serve template Meta approvato` };
  }

  const result = hasTemplate
    ? await sendWhatsAppTemplateSafely({
        to: input.telefono,
        templateName: input.templateName ?? "",
        bodyParameters: input.templateParameters?.map((text) => ({ type: "text", text })),
      })
    : await sendWhatsAppTextSafely({
        to: input.telefono,
        text: input.testo,
      });
  await logWhatsAppOutbound({
    contattoId: input.contattoId,
    telefono: input.telefono,
    sorgente: input.templateName ? `automazione_${input.tipo}_template` : `automazione_${input.tipo}`,
    testo: input.testo,
    result,
  });

  if (result.status === "sent" || result.status === "skipped") {
    await db.insert(messaggiTable).values({
      contatto_id: input.contattoId,
      canale: "whatsapp",
      direzione: "outbound",
      testo: input.testo,
      mittente_nome: "Automazione CRM",
    });

    await db
      .update(contattiCrmTable)
      .set({ ultimo_contatto: new Date() })
      .where(eq(contattiCrmTable.id, input.contattoId));
  }

  if (result.status === "sent") {
    await logAutomazione(
      input.tipo,
      input.contattoId,
      input.contattoNome,
      `Messaggio inviato via WhatsApp a ${input.contattoNome} (${input.telefono})`,
    );
    return { stato: "eseguito" as const, dettagli: `Messaggio inviato a ${input.contattoNome} (${input.telefono})` };
  }

  if (result.status === "skipped") {
    await logAutomazione(
      input.tipo,
      input.contattoId,
      input.contattoNome,
      `Messaggio registrato senza invio Meta per ${input.contattoNome}: ${result.reason}`,
      "saltato",
    );
    return { stato: "saltato" as const, dettagli: `Messaggio registrato per ${input.contattoNome} senza invio Meta` };
  }

  await logAutomazione(
    input.tipo,
    input.contattoId,
    input.contattoNome,
    `Invio WhatsApp fallito per ${input.contattoNome} (${input.telefono}): ${result.reason}`,
    "errore",
  );
  return { stato: "errore" as const, dettagli: `Invio fallito per ${input.contattoNome}: ${result.reason}` };
}

export async function runReengagement(): Promise<{ eseguiti: number; dettagli: string[] }> {
  const attivo = await isConfigEnabled("reengagement_attivo", true);
  if (!attivo) {
    await logAutomazione("reengagement", null, null, "Job saltato: automazione disattivata", "saltato");
    return { eseguiti: 0, dettagli: ["Automazione disattivata"] };
  }

  const mesiStr = await getConfigValue("reengagement_mesi", "3");
  const mesi = parseInt(mesiStr, 10);
  const tipiEvento = parseTipiEventoConfig(await getConfigValue("reengagement_tipi_evento", "all"));

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - mesi);

  const leadPersi = await db
    .select()
    .from(contattiCrmTable)
    .where(and(eq(contattiCrmTable.stato_lead, "perso"), lte(contattiCrmTable.ultimo_contatto, cutoff)));
  const leadSegmentati = leadPersi.filter((contatto) => matchesTipoEvento(contatto.tipo_evento, tipiEvento));

  const dettagli: string[] = [];
  const templateName = process.env.META_WHATSAPP_REENGAGEMENT_TEMPLATE_NAME;

  if (leadPersi.length > 0 && leadSegmentati.length === 0) {
    await logAutomazione("reengagement", null, null, "Job saltato: nessun lead perso rientra nei tipi evento configurati", "saltato");
  }

  for (const contatto of leadSegmentati) {
    const msg = `Ciao ${contatto.nome}! Sono passati alcuni mesi dalla nostra ultima chiacchierata. Siamo sempre disponibili per organizzare il tuo evento speciale. Quando vuoi, scrivici! - Team Zak`;
    const result = await inviaMessaggioAutomazione({
      tipo: "reengagement",
      contattoId: contatto.id,
      contattoNome: contatto.nome,
      telefono: contatto.telefono,
      testo: msg,
      templateName,
      templateParameters: [contatto.nome],
    });
    dettagli.push(result.dettagli);
  }

  return { eseguiti: leadSegmentati.length, dettagli };
}

export async function runRicorrenze(): Promise<{ eseguiti: number; dettagli: string[] }> {
  const attivo = await isConfigEnabled("ricorrenza_attiva", true);
  if (!attivo) {
    await logAutomazione("ricorrenza", null, null, "Job saltato: automazione disattivata", "saltato");
    return { eseguiti: 0, dettagli: ["Automazione disattivata"] };
  }

  const mesiStr = await getConfigValue("ricorrenza_mesi_anticipo", "10");
  const mesi = parseInt(mesiStr, 10);
  const tipiEvento = parseTipiEventoConfig(await getConfigValue("ricorrenza_tipi_evento", "all"));

  const dataTarget = new Date();
  dataTarget.setMonth(dataTarget.getMonth() - mesi);

  const inizioFinestra = new Date(dataTarget);
  inizioFinestra.setDate(inizioFinestra.getDate() - 3);
  const fineFinestra = new Date(dataTarget);
  fineFinestra.setDate(fineFinestra.getDate() + 3);

  const inizioStr = inizioFinestra.toISOString().split("T")[0];
  const fineStr = fineFinestra.toISOString().split("T")[0];

  const contattiConPrev = await db.execute(sql`
    SELECT p.id, p.contatto_id, p.data_evento_richiesta,
           c.nome as contatto_nome, c.telefono, c.tipo_evento
    FROM preventivi_eventi p
    JOIN contatti_crm c ON c.id = p.contatto_id
    WHERE p.stato_evento = 'confermato'
      AND p.data_evento_richiesta IS NOT NULL
      AND p.data_evento_richiesta::date BETWEEN ${inizioStr}::date AND ${fineStr}::date
  `);

  const dettagli: string[] = [];
  const templateName = process.env.META_WHATSAPP_RICORRENZA_TEMPLATE_NAME;
  const righeSegmentate = (contattiConPrev.rows as Array<{ contatto_id: string; contatto_nome: string; telefono: string | null; tipo_evento: string | null }>).filter(
    (row) => matchesTipoEvento(row.tipo_evento, tipiEvento),
  );

  if (contattiConPrev.rows.length > 0 && righeSegmentate.length === 0) {
    await logAutomazione("ricorrenza", null, null, "Job saltato: nessuna ricorrenza rientra nei tipi evento configurati", "saltato");
  }

  for (const row of righeSegmentate) {
    const tipoEvento = row.tipo_evento || "evento";
    const annoSuccessivo = new Date().getFullYear() + 1;
    const msg = `Ciao ${row.contatto_nome}! L'anno scorso hai festeggiato con noi il tuo ${tipoEvento} ed e gia il momento di pensare al ${annoSuccessivo}. Vuoi prenotare di nuovo? Hai la priorita come cliente affezionato. - Team Zak`;
    const result = await inviaMessaggioAutomazione({
      tipo: "ricorrenza",
      contattoId: row.contatto_id,
      contattoNome: row.contatto_nome,
      telefono: row.telefono,
      testo: msg,
      templateName,
      templateParameters: [row.contatto_nome, tipoEvento, String(annoSuccessivo)],
    });
    dettagli.push(result.dettagli);
  }

  return { eseguiti: righeSegmentate.length, dettagli };
}

export async function runPromemoriaAgenda(): Promise<{ eseguiti: number; dettagli: string[] }> {
  const attivo = await isConfigEnabled("promemoria_attivo", true);
  if (!attivo) {
    await logAutomazione("promemoria", null, null, "Job saltato: promemoria agenda disattivati", "saltato");
    return { eseguiti: 0, dettagli: ["Promemoria agenda disattivati"] };
  }

  const minutiStr = await getConfigValue("promemoria_minuti_anticipo", "60");
  const minuti = Math.max(parseInt(minutiStr, 10) || 60, 1);
  const now = new Date();
  const finestraFine = new Date(now.getTime() + minuti * 60 * 1000);

  const eventi = await db
    .select({
      id: agendaPersonaleTable.id,
      titolo: agendaPersonaleTable.titolo,
      data_ora_inizio: agendaPersonaleTable.data_ora_inizio,
      contatto_id: agendaPersonaleTable.contatto_id,
      contatto_nome: contattiCrmTable.nome,
    })
    .from(agendaPersonaleTable)
    .leftJoin(contattiCrmTable, eq(contattiCrmTable.id, agendaPersonaleTable.contatto_id))
    .where(and(
      eq(agendaPersonaleTable.promemoria_inviato, false),
      gte(agendaPersonaleTable.data_ora_inizio, now),
      lte(agendaPersonaleTable.data_ora_inizio, finestraFine),
    ))
    .orderBy(agendaPersonaleTable.data_ora_inizio);

  const dettagli: string[] = [];
  for (const evento of eventi) {
    const quando = evento.data_ora_inizio.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
    const dettaglio = `Promemoria agenda: "${evento.titolo}" previsto il ${quando}${evento.contatto_nome ? ` per ${evento.contatto_nome}` : ""}`;
    await logAutomazione("promemoria", evento.contatto_id, evento.contatto_nome, dettaglio);
    await db
      .update(agendaPersonaleTable)
      .set({ promemoria_inviato: true })
      .where(eq(agendaPersonaleTable.id, evento.id));
    dettagli.push(dettaglio);
  }

  return { eseguiti: eventi.length, dettagli };
}

router.get("/automazioni/log", async (req, res) => {
  const { tipo, limit } = req.query as { tipo?: string; limit?: string };
  const lim = Math.min(parseInt(limit || "50", 10), 200);

  const rows = await db
    .select()
    .from(automazioniLogTable)
    .where(tipo ? eq(automazioniLogTable.tipo, tipo) : undefined)
    .orderBy(desc(automazioniLogTable.data_esecuzione))
    .limit(lim);

  res.json(rows);
});

router.get("/automazioni/performance", async (_req, res) => {
  const rows = await db.select().from(automazioniLogTable);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const totals = {
    totale: rows.length,
    eseguiti: 0,
    saltati: 0,
    errori: 0,
    tasso_successo: 0,
    ultimi_30_giorni: 0,
    per_tipo: [] as Array<ReturnType<typeof createPerformanceBucket>>,
  };
  const byTipo = new Map<string, ReturnType<typeof createPerformanceBucket>>();

  for (const row of rows) {
    const bucket = byTipo.get(row.tipo) ?? createPerformanceBucket(row.tipo);
    bucket.totale++;

    if (row.stato === "eseguito") {
      totals.eseguiti++;
      bucket.eseguiti++;
    } else if (row.stato === "saltato") {
      totals.saltati++;
      bucket.saltati++;
    } else {
      totals.errori++;
      bucket.errori++;
    }

    if (row.data_esecuzione >= cutoff) {
      totals.ultimi_30_giorni++;
    }

    byTipo.set(row.tipo, bucket);
  }

  totals.tasso_successo = totals.totale > 0 ? Math.round((totals.eseguiti / totals.totale) * 1000) / 10 : 0;
  totals.per_tipo = Array.from(byTipo.values()).sort((a, b) => b.totale - a.totale);

  res.json(totals);
});

router.get("/automazioni/config", async (req, res) => {
  await ensureAutomationConfigDefaults();
  const rows = await db.select().from(automazioniConfigTable).orderBy(automazioniConfigTable.chiave);
  res.json(rows);
});

router.patch("/automazioni/config/:chiave", async (req, res) => {
  const { valore } = req.body;
  const normalizedValue = normalizeConfigValue(req.params.chiave, valore);
  if (!normalizedValue) {
    res.status(400).json({ error: "valore required" });
    return;
  }

  const existing = await db.select().from(automazioniConfigTable).where(eq(automazioniConfigTable.chiave, req.params.chiave));
  if (existing.length === 0) {
    res.status(404).json({ error: "Config not found" });
    return;
  }

  const [row] = await db
    .update(automazioniConfigTable)
    .set({ valore: normalizedValue, aggiornato_il: new Date() })
    .where(eq(automazioniConfigTable.chiave, req.params.chiave))
    .returning();

  await logAuditAction({ req, azione: "update_config", entita: "automazione", entitaId: row.chiave, dettagli: { valore: normalizedValue } });
  res.json(row);
});

router.post("/automazioni/trigger", async (req, res) => {
  const { tipo } = req.body;
  if (!tipo) {
    res.status(400).json({ error: "tipo required" });
    return;
  }

  let result: { eseguiti: number; dettagli: string[] };

  if (tipo === "reengagement") {
    result = await runReengagement();
  } else if (tipo === "ricorrenza") {
    result = await runRicorrenze();
  } else if (tipo === "promemoria") {
    result = await runPromemoriaAgenda();
  } else {
    res.status(400).json({ error: `Tipo sconosciuto: ${tipo}` });
    return;
  }

  await logAuditAction({ req, azione: "trigger", entita: "automazione", entitaId: tipo, dettagli: result });
  res.json(result);
});

export default router;
