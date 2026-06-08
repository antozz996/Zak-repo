import { Router } from "express";
import {
  b2bCompetitorTable,
  b2bMaterialiTable,
  b2bTemplateTable,
  db,
  insertB2BCompetitorSchema,
  insertB2BMaterialeSchema,
  insertB2BTemplateSchema,
  updateB2BCompetitorSchema,
  updateB2BMaterialeSchema,
  updateB2BTemplateSchema,
} from "@workspace/db";
import { AnalyzeB2BCompetitorBody, ExportB2BPitchBody } from "@workspace/api-zod";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { logAuditAction } from "../lib/audit-log";

const router = Router();

const splitStrategicNotes = (value: string | null | undefined, fallback: string[]) => {
  const items = value
    ?.split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items && items.length > 0 ? items.slice(0, 4) : fallback;
};

const buildB2BSlides = (input: { titolo: string; target: string; messaggio?: string; budget?: number }) => {
  const budgetLine = input.budget ? `Budget indicativo: EUR ${input.budget.toLocaleString("it-IT")}.` : "Budget da finalizzare in trattativa.";

  return [
    {
      titolo: "Scenario e obiettivo",
      contenuto: `Proposta Zak per ${input.target}. Obiettivo: trasformare la relazione commerciale in prenotazioni qualificate e ricorrenti.`,
    },
    {
      titolo: "Valore per il partner",
      contenuto: input.messaggio || "Esperienza evento completa, risposta rapida, pacchetti chiari e gestione CRM centralizzata.",
    },
    {
      titolo: "Offerta operativa",
      contenuto: `${budgetLine} Il pacchetto puo includere venue, food, beverage, audio, contenuti social e assistenza organizzativa.`,
    },
    {
      titolo: "Vantaggio competitivo",
      contenuto: "Zak riduce tempi di risposta, dispersione dei lead e lavoro manuale dello staff con inbox, CRM e automazioni integrate.",
    },
    {
      titolo: "Prossimo step",
      contenuto: "Confermare target, data indicativa, numero partecipanti e referente operativo per preparare la proposta finale.",
    },
  ];
};

router.get("/b2b/competitor", async (req, res) => {
  const { search, categoria } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];

  if (categoria) {
    conditions.push(eq(b2bCompetitorTable.categoria, categoria));
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(b2bCompetitorTable.nome, pattern),
      ilike(b2bCompetitorTable.citta, pattern),
      ilike(b2bCompetitorTable.target, pattern),
      ilike(b2bCompetitorTable.note, pattern),
    ) as SQL);
  }

  const rows = await db
    .select()
    .from(b2bCompetitorTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(b2bCompetitorTable.data_aggiornamento));

  res.json(rows);
});

router.post("/b2b/competitor", async (req, res) => {
  const parsed = insertB2BCompetitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(b2bCompetitorTable)
    .values({ ...parsed.data, data_aggiornamento: new Date() })
    .returning();

  await logAuditAction({
    req,
    azione: "create",
    entita: "b2b_competitor",
    entitaId: row.id,
    dettagli: { nome: row.nome, categoria: row.categoria },
  });
  res.status(201).json(row);
});

router.get("/b2b/competitor/:id", async (req, res) => {
  const [row] = await db
    .select()
    .from(b2bCompetitorTable)
    .where(eq(b2bCompetitorTable.id, req.params.id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(row);
});

router.patch("/b2b/competitor/:id", async (req, res) => {
  const parsed = updateB2BCompetitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(b2bCompetitorTable)
    .set({ ...parsed.data, data_aggiornamento: new Date() })
    .where(eq(b2bCompetitorTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({
    req,
    azione: "update",
    entita: "b2b_competitor",
    entitaId: row.id,
    dettagli: parsed.data,
  });
  res.json(row);
});

router.delete("/b2b/competitor/:id", async (req, res) => {
  const [row] = await db
    .delete(b2bCompetitorTable)
    .where(eq(b2bCompetitorTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({
    req,
    azione: "delete",
    entita: "b2b_competitor",
    entitaId: req.params.id,
    dettagli: { nome: row.nome },
  });
  res.status(204).send();
});

router.get("/b2b/materiali", async (req, res) => {
  const { competitor_id, stato } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (competitor_id) conditions.push(eq(b2bMaterialiTable.competitor_id, competitor_id));
  if (stato) conditions.push(eq(b2bMaterialiTable.stato, stato));

  const rows = await db
    .select({
      id: b2bMaterialiTable.id,
      competitor_id: b2bMaterialiTable.competitor_id,
      competitor_nome: b2bCompetitorTable.nome,
      nome_file: b2bMaterialiTable.nome_file,
      tipo_materiale: b2bMaterialiTable.tipo_materiale,
      url: b2bMaterialiTable.url,
      stato: b2bMaterialiTable.stato,
      note: b2bMaterialiTable.note,
      data_creazione: b2bMaterialiTable.data_creazione,
    })
    .from(b2bMaterialiTable)
    .leftJoin(b2bCompetitorTable, eq(b2bCompetitorTable.id, b2bMaterialiTable.competitor_id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(b2bMaterialiTable.data_creazione));

  res.json(rows);
});

router.post("/b2b/materiali", async (req, res) => {
  const parsed = insertB2BMaterialeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(b2bMaterialiTable)
    .values(parsed.data)
    .returning();

  await logAuditAction({
    req,
    azione: "create",
    entita: "b2b_materiale",
    entitaId: row.id,
    dettagli: { competitor_id: row.competitor_id, nome_file: row.nome_file },
  });
  res.status(201).json({ ...row, competitor_nome: null });
});

router.patch("/b2b/materiali/:id", async (req, res) => {
  const parsed = updateB2BMaterialeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(b2bMaterialiTable)
    .set(parsed.data)
    .where(eq(b2bMaterialiTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({
    req,
    azione: "update",
    entita: "b2b_materiale",
    entitaId: row.id,
    dettagli: parsed.data,
  });
  res.json({ ...row, competitor_nome: null });
});

router.delete("/b2b/materiali/:id", async (req, res) => {
  const [row] = await db
    .delete(b2bMaterialiTable)
    .where(eq(b2bMaterialiTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({
    req,
    azione: "delete",
    entita: "b2b_materiale",
    entitaId: req.params.id,
    dettagli: { nome_file: row.nome_file },
  });
  res.status(204).send();
});

router.get("/b2b/template", async (req, res) => {
  const { target_tipo } = req.query as Record<string, string | undefined>;
  const rows = await db
    .select()
    .from(b2bTemplateTable)
    .where(target_tipo ? eq(b2bTemplateTable.target_tipo, target_tipo) : undefined)
    .orderBy(desc(b2bTemplateTable.data_aggiornamento));

  res.json(rows);
});

router.post("/b2b/template", async (req, res) => {
  const parsed = insertB2BTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(b2bTemplateTable)
    .values({ ...parsed.data, data_aggiornamento: new Date() })
    .returning();

  await logAuditAction({
    req,
    azione: "create",
    entita: "b2b_template",
    entitaId: row.id,
    dettagli: { titolo: row.titolo, target_tipo: row.target_tipo },
  });
  res.status(201).json(row);
});

router.patch("/b2b/template/:id", async (req, res) => {
  const parsed = updateB2BTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(b2bTemplateTable)
    .set({ ...parsed.data, data_aggiornamento: new Date() })
    .where(eq(b2bTemplateTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({
    req,
    azione: "update",
    entita: "b2b_template",
    entitaId: row.id,
    dettagli: parsed.data,
  });
  res.json(row);
});

router.delete("/b2b/template/:id", async (req, res) => {
  const [row] = await db
    .delete(b2bTemplateTable)
    .where(eq(b2bTemplateTable.id, req.params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAuditAction({
    req,
    azione: "delete",
    entita: "b2b_template",
    entitaId: req.params.id,
    dettagli: { titolo: row.titolo },
  });
  res.status(204).send();
});

router.post("/b2b/analisi-competitor", async (req, res) => {
  const parsed = AnalyzeB2BCompetitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const competitor = parsed.data.competitor_id
    ? (await db
      .select()
      .from(b2bCompetitorTable)
      .where(eq(b2bCompetitorTable.id, parsed.data.competitor_id)))[0]
    : undefined;

  const focus = parsed.data.focus || "generale";
  const baseTitle = competitor?.nome || "scenario B2B selezionato";
  const puntiForza = splitStrategicNotes(competitor?.punti_forza, [
    "Brand riconoscibile sul territorio",
    "Portfolio commerciale gia strutturato",
    "Presenza digitale utile per acquisire fiducia",
  ]);
  const puntiDeboli = splitStrategicNotes(competitor?.punti_deboli, [
    "Tempi di risposta potenzialmente non presidiati",
    "Preventivazione spesso poco immediata",
    "Esperienza commerciale non sempre personalizzata",
  ]);

  const opportunitaByFocus = {
    prezzo: [
      "Usare pacchetti trasparenti per ridurre attrito sul budget",
      "Spingere date infrasettimanali con marginalita controllata",
      "Separare extra e servizi inclusi per rendere il confronto piu chiaro",
    ],
    proposta: [
      "Convertire il messaggio commerciale in una proposta visuale per target",
      "Aggiungere prove sociali e casi d'uso per scuole, aziende e agenzie",
      "Ridurre il tempo tra richiesta e bozza proposta",
    ],
    debolezze: [
      "Creare script commerciali che evidenziano velocita e flessibilita Zak",
      "Preparare risposte preventive su extra-costi e vincoli organizzativi",
      "Usare follow-up automatici per intercettare lead non presidiati dai competitor",
    ],
    generale: [
      "Posizionare Zak come venue piu rapida nella risposta commerciale",
      "Creare template verticali per scuole, aziende e agenzie eventi",
      "Collegare archivio competitor, materiali e pitch in un unico flusso operativo",
    ],
  } satisfies Record<string, string[]>;

  const result = {
    titolo: `Analisi competitor: ${baseTitle}`,
    sintesi: `Analisi strutturata generata in modalita deterministica sul focus "${focus}". Prompt staff: ${parsed.data.prompt}`,
    punti_forza: puntiForza,
    punti_deboli: puntiDeboli,
    opportunita: opportunitaByFocus[focus],
    azioni_consigliate: [
      "Aggiornare scheda competitor con pricing, target e materiali recenti",
      "Preparare un pitch B2B dedicato al target piu vulnerabile",
      "Aggiungere follow-up CRM entro 48 ore per i lead caldi",
      "Confrontare ogni proposta Zak con almeno due elementi differenzianti misurabili",
    ],
    confidence: competitor ? "alta" : "media",
  };

  await logAuditAction({
    req,
    azione: "analyze",
    entita: "b2b_competitor",
    entitaId: competitor?.id,
    dettagli: { focus, competitor_id: competitor?.id, prompt: parsed.data.prompt },
  });

  res.json(result);
});

router.post("/b2b/export", async (req, res) => {
  const parsed = ExportB2BPitchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const slides = buildB2BSlides(parsed.data);
  const safeTitle = parsed.data.titolo
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || "pitch-b2b-zak";
  const extension = parsed.data.formato === "pdf" ? "pdf" : "json";
  const contenuto = [
    `# ${parsed.data.titolo}`,
    `Target: ${parsed.data.target}`,
    parsed.data.budget ? `Budget: EUR ${parsed.data.budget.toLocaleString("it-IT")}` : "Budget: da definire",
    "",
    ...slides.map((slide, index) => `## ${index + 1}. ${slide.titolo}\n${slide.contenuto}`),
  ].join("\n");

  await logAuditAction({
    req,
    azione: "export",
    entita: "b2b_pitch",
    dettagli: { formato: parsed.data.formato, titolo: parsed.data.titolo, target: parsed.data.target },
  });

  res.json({
    formato: parsed.data.formato,
    titolo: parsed.data.titolo,
    contenuto,
    download_filename: `${safeTitle}.${extension}`,
    slides,
  });
});

export default router;
