import { useState } from "react";
import {
  Building2,
  FileText,
  Sparkles,
  Search,
  Plus,
  Download,
  Trash2,
  Eye,
  Star,
  Upload,
  GraduationCap,
  Briefcase,
  Handshake,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Sparkle,
  Send,
  Info,
  Clock,
  Loader2,
  Layers,
  FileDown,
  Presentation,
} from "lucide-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  getListB2BCompetitorQueryKey,
  getListB2BMaterialiQueryKey,
  getListB2BTemplateQueryKey,
  useAnalyzeB2BCompetitor,
  useCreateB2BCompetitor,
  useCreateB2BMateriale,
  useCreateB2BTemplate,
  useDeleteB2BCompetitor,
  useDeleteB2BMateriale,
  useDeleteB2BTemplate,
  useExportB2BPitch,
  useListB2BCompetitor,
  useListB2BMateriali,
  useListB2BTemplate,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

/* ────────────────────────────────────────────────────
   Demo Data Types
   ──────────────────────────────────────────────────── */

interface Competitor {
  id: number;
  nome: string;
  tipo: string;
  citta: string;
  zona: string;
  target: string;
  prezzoMedio: number; // prezzo medio stimato per pax
  rating: number;
  puntiForza: string[];
  puntiDeboli: string[];
  sito: string;
  instagram: string;
  materiali: number;
  ultimoAggiornamento: string;
}

const initialCompetitors: Competitor[] = [
  {
    id: 1,
    nome: "Villa Reale Events",
    tipo: "Location eventi",
    citta: "Monza",
    zona: "Monza Parco",
    target: "Matrimoni & Eventi Gala",
    prezzoMedio: 160,
    rating: 4.5,
    puntiForza: ["Location prestigiosa", "Servizio catering interno", "Parcheggio ampio"],
    puntiDeboli: ["Prezzi molto elevati", "Disponibilita' limitata nei weekend"],
    sito: "villarealeevents.it",
    instagram: "@villareale_events",
    materiali: 5,
    ultimoAggiornamento: "2026-05-28",
  },
  {
    id: 2,
    nome: "Loft Experience",
    tipo: "Spazio eventi moderno",
    citta: "Milano",
    zona: "Navigli (Milano)",
    target: "Feste Private & Giovani",
    prezzoMedio: 90,
    rating: 4.2,
    puntiForza: ["Design industriale moderno", "Flessibilita' layout", "DJ resident"],
    puntiDeboli: ["Zona periferica", "Capienza massima limitata a 150 pax"],
    sito: "loftexperience.it",
    instagram: "@loft_experience",
    materiali: 3,
    ultimoAggiornamento: "2026-05-15",
  },
  {
    id: 3,
    nome: "Garden Party Club",
    tipo: "Club all'aperto",
    citta: "Monza",
    zona: "Hinterland Monza",
    target: "Feste di Laurea & Compleanni",
    prezzoMedio: 70,
    rating: 3.8,
    puntiForza: ["Spazio all'aperto ampio", "Prezzi competitivi", "Doppio bar esterno"],
    puntiDeboli: ["Stagionale", "Acustica non eccellente", "Manca catering interno"],
    sito: "gardenpartyclub.it",
    instagram: "@gardenparty_monza",
    materiali: 2,
    ultimoAggiornamento: "2026-04-20",
  },
  {
    id: 4,
    nome: "Palazzo Storico Visconti",
    tipo: "Location storica",
    citta: "Milano",
    zona: "Centro Storico (Milano)",
    target: "Eventi Corporate Lusso",
    prezzoMedio: 220,
    rating: 4.7,
    puntiForza: ["Atmosfera d'epoca unica", "Affreschi originali", "Staff dedicato"],
    puntiDeboli: ["Budget minimo molto alto", "Limitazioni acustiche dopo le 23:00"],
    sito: "palazzovisconti.it",
    instagram: "@palazzovisconti_mi",
    materiali: 7,
    ultimoAggiornamento: "2026-05-30",
  },
];

interface DemoFile {
  id: number;
  nome: string;
  comp: string;
  size: string;
  data: string;
  stato: "caricato" | "da analizzare" | "analizzato";
}

interface CoBrandingTemplate {
  id: number;
  titolo: string;
  tipo: "scuola" | "universita" | "azienda" | "palestra" | "agenzia";
  target: string;
  messaggio: string;
  vantaggi: string[];
  cta: string;
  usato: number;
}

const initialTemplates: CoBrandingTemplate[] = [
  {
    id: 1,
    titolo: "Template Scuole Superiori - Mak P",
    tipo: "scuola",
    target: "Comitati studenteschi e rappresentanti di istituto",
    messaggio: "Festeggia la fine delle superiori in una location di tendenza, con buffet studentesco, DJ set e impianto audio-luci professionale incluso.",
    vantaggi: ["Prezzo ridotto per studenti", "Servizio security incluso per tranquillita' dei genitori", "Gestione caparra agevolata"],
    cta: "Configura Proposta Scuole",
    usato: 14,
  },
  {
    id: 2,
    titolo: "Template Universita' - Laurea Exclusive",
    tipo: "universita",
    target: "Neolaureati e associazioni universitarie",
    messaggio: "Un party di laurea memorabile con open bar di livello, terrazza per brindisi e impianto multimediale per proiettare video celebrativi.",
    vantaggi: ["Allestimento a tema corona d'alloro", "Brindisi di benvenuto e finger food inclusi", "Fino a 150 invitati"],
    cta: "Usa Template Laurea",
    usato: 19,
  },
  {
    id: 3,
    titolo: "Template Corporate Team Building",
    tipo: "azienda",
    target: "Responsabili HR e Direttori Commerciali",
    messaggio: "Giornata dedicata al rafforzamento del team con meeting diurno, pranzo business e attivita' ricreative pomeridiane con supporto tech.",
    vantaggi: ["Wi-Fi ad alta velocita' e schermi integrati", "Fatturazione elettronica diretta", "Menu business personalizzabili"],
    cta: "Genera Proposta Aziende",
    usato: 23,
  },
  {
    id: 4,
    titolo: "Template Palestre e Associazioni",
    tipo: "palestra",
    target: "Proprietari di centri sportivi e associazioni",
    messaggio: "Cena sociale o premiazione sportiva di fine anno in un ambiente versatile con maxischermo per i video delle gare e menu bilanciati.",
    vantaggi: ["Tariffe agevolate nei giorni infrasettimanali", "Spazio palco per premiazioni e foto", "Promozione social incrociata"],
    cta: "Configura Convenzione Sportiva",
    usato: 7,
  },
  {
    id: 5,
    titolo: "Template Agenzie Eventi Partner",
    tipo: "agenzia",
    target: "Wedding planner ed agenzie di organizzazione eventi",
    messaggio: "Collaborazione esclusiva per portare i vostri clienti nella nostra venue, sbloccando provvigioni e coordinatore interno dedicato.",
    vantaggi: ["Provvigione fissa del 10% sui servizi di affitto", "Sopralluoghi illimitati gratuiti", "Priorita' sulle date in alta stagione"],
    cta: "Crea Partnership Agenzie",
    usato: 11,
  },
];

export default function B2BCompetitor() {
  const queryClient = useQueryClient();
  const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors);
  const [realSearch, setRealSearch] = useState("");
  const [realName, setRealName] = useState("");
  const [realCity, setRealCity] = useState("");
  const [realCategory, setRealCategory] = useState("location_eventi");
  const [materialName, setMaterialName] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materialCompetitorId, setMaterialCompetitorId] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateTarget, setTemplateTarget] = useState("azienda");
  const [templateMessage, setTemplateMessage] = useState("");
  const [realAnalysisCompetitorId, setRealAnalysisCompetitorId] = useState("");
  const [realAnalysisFocus, setRealAnalysisFocus] = useState<"prezzo" | "proposta" | "debolezze" | "generale">("generale");
  const [realAnalysisResult, setRealAnalysisResult] = useState<any | null>(null);
  const [realExportResult, setRealExportResult] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tutti");
  const [selectedComp, setSelectedComp] = useState<Competitor | null>(null);

  // Task D2 states: Demo Files with reactive simulation
  const [files, setFiles] = useState<DemoFile[]>([
    { id: 1, nome: "Brochure Villa Reale 2026.pdf", comp: "Villa Reale Events", size: "2.4 MB", data: "28/05/2026", stato: "analizzato" },
    { id: 2, nome: "Menu Catering Loft.pdf", comp: "Loft Experience", size: "1.8 MB", data: "15/05/2026", stato: "da analizzare" },
    { id: 3, nome: "Listino Matrimoni Visconti.pdf", comp: "Palazzo Visconti", size: "4.1 MB", data: "30/05/2026", stato: "analizzato" },
    { id: 4, nome: "Screenshot Instagram Promo.png", comp: "Garden Party Club", size: "900 KB", data: "20/04/2026", stato: "caricato" },
  ]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [analyzingFileId, setAnalyzingFileId] = useState<number | null>(null);

  // Task D3 states: Prompt AI simulator
  const [prompt, setPrompt] = useState("");
  const [selectedCompForAI, setSelectedCompForAI] = useState("Tutti");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Precompiled Prompt Templates for D3
  const promptTemplates = [
    {
      titolo: "Analisi Prezzo",
      descrizione: "Confronta tariffe e rileva margini di manovra.",
      text: "Confronta il posizionamento di prezzo di questo competitor rispetto alla nostra tariffa media (€ 100/pax). Suggerisci come ottimizzare i nostri margini per eventi privati."
    },
    {
      titolo: "Analisi Proposta Commerciale",
      descrizione: "Analizza canali, materiale promozionale e stile.",
      text: "Valuta la struttura della proposta commerciale e della brochure di questo competitor. Come possiamo rendere la nostra offerta visivamente piu' attraente e persuasiva?"
    },
    {
      titolo: "Punti Deboli Competitor",
      descrizione: "Rileva criticita' e ritardi del concorrente.",
      text: "Identifica i punti di debolezza operativi del competitor (es. tempi di risposta lenti, extra-costi, regole rigide) e spiega come usarli a nostro favore durante la trattativa."
    }
  ];

  // Task D4 states: Template selection & Pitch Generator integration
  const [pitchTargetType, setPitchTargetType] = useState<string>("azienda");
  const [pitchOrgName, setPitchOrgName] = useState("Azienda Rossi S.p.A.");
  const [pitchGuests, setPitchGuests] = useState(100);
  const [pitchBudget, setPitchBudget] = useState(5000);
  const [pitchDescription, setPitchDescription] = useState("Meeting aziendale con buffet business e area meeting attrezzata.");
  const [pitchAdvantages, setPitchAdvantages] = useState<string[]>(["Wi-Fi ad alta velocita'", "Fatturazione elettronica"]);
  const [pitchGenerated, setPitchGenerated] = useState<any | null>(null);

  // Task D5 states: Slideshow preview and simulated export progress
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportType, setExportType] = useState<"pdf" | "presentation" | null>(null);
  const [exportStatusText, setExportStatusText] = useState("");

  // Add Competitor modal simulation state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Location eventi");
  const [newCity, setNewCity] = useState("Milano");
  const [newZona, setNewZona] = useState("Hinterland");
  const [newTarget, setNewTarget] = useState("Matrimoni & Corporate");
  const [newPrezzo, setNewPrezzo] = useState(100);
  const [newRating, setNewRating] = useState(4.0);

  const realCompetitorParams = {
    search: realSearch || undefined,
  };
  const { data: realCompetitors = [], isLoading: realCompetitorsLoading } = useListB2BCompetitor(realCompetitorParams);
  const { data: realMaterials = [], isLoading: realMaterialsLoading } = useListB2BMateriali();
  const { data: realTemplates = [], isLoading: realTemplatesLoading } = useListB2BTemplate();
  const createRealCompetitor = useCreateB2BCompetitor();
  const deleteRealCompetitor = useDeleteB2BCompetitor();
  const createRealMaterial = useCreateB2BMateriale();
  const deleteRealMaterial = useDeleteB2BMateriale();
  const createRealTemplate = useCreateB2BTemplate();
  const deleteRealTemplate = useDeleteB2BTemplate();
  const analyzeRealCompetitor = useAnalyzeB2BCompetitor();
  const exportRealPitch = useExportB2BPitch();

  const refreshRealCompetitors = async () => {
    await queryClient.invalidateQueries({ queryKey: getListB2BCompetitorQueryKey(realCompetitorParams) });
  };

  const refreshRealMaterials = async () => {
    await queryClient.invalidateQueries({ queryKey: getListB2BMaterialiQueryKey() });
  };

  const refreshRealTemplates = async () => {
    await queryClient.invalidateQueries({ queryKey: getListB2BTemplateQueryKey() });
  };

  const addRealCompetitor = async () => {
    if (!realName.trim()) return;
    await createRealCompetitor.mutateAsync({
      data: {
        nome: realName.trim(),
        categoria: realCategory,
        citta: realCity.trim() || undefined,
      },
    });
    setRealName("");
    setRealCity("");
    await refreshRealCompetitors();
  };

  const removeRealCompetitor = async (id: string) => {
    if (!confirm("Eliminare questo competitor dall'archivio reale?")) return;
    await deleteRealCompetitor.mutateAsync({ id });
    await refreshRealCompetitors();
  };

  const addRealMaterial = async () => {
    if (!materialName.trim()) return;
    await createRealMaterial.mutateAsync({
      data: {
        nome_file: materialName.trim(),
        competitor_id: materialCompetitorId || undefined,
        url: materialUrl.trim() || undefined,
        tipo_materiale: "brochure",
        stato: "caricato",
      },
    });
    setMaterialName("");
    setMaterialUrl("");
    setMaterialCompetitorId("");
    await refreshRealMaterials();
  };

  const removeRealMaterial = async (id: string) => {
    if (!confirm("Eliminare questo materiale dall'archivio reale?")) return;
    await deleteRealMaterial.mutateAsync({ id });
    await refreshRealMaterials();
  };

  const addRealTemplate = async () => {
    if (!templateTitle.trim() || !templateMessage.trim()) return;
    await createRealTemplate.mutateAsync({
      data: {
        titolo: templateTitle.trim(),
        target_tipo: templateTarget,
        messaggio: templateMessage.trim(),
        cta: "Richiedi proposta",
      },
    });
    setTemplateTitle("");
    setTemplateMessage("");
    await refreshRealTemplates();
  };

  const removeRealTemplate = async (id: string) => {
    if (!confirm("Eliminare questo template B2B reale?")) return;
    await deleteRealTemplate.mutateAsync({ id });
    await refreshRealTemplates();
  };

  const runRealAnalysis = async () => {
    const result = await analyzeRealCompetitor.mutateAsync({
      data: {
        competitor_id: realAnalysisCompetitorId || undefined,
        prompt: prompt.trim() || "Analizza posizionamento, differenze operative e opportunita commerciali per Zak.",
        focus: realAnalysisFocus,
      },
    });
    setRealAnalysisResult(result);
  };

  const runRealExport = async (formato: "pdf" | "presentazione") => {
    const result = await exportRealPitch.mutateAsync({
      data: {
        titolo: templateTitle.trim() || pitchGenerated?.titolo || `Proposta B2B Zak - ${pitchOrgName}`,
        target: templateTarget || pitchTargetType,
        messaggio: templateMessage.trim() || pitchGenerated?.descrizione || pitchDescription,
        budget: pitchBudget,
        formato,
      },
    });
    setRealExportResult(result);
  };

  // Handles adding new competitor (mock)
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newComp: Competitor = {
      id: Date.now(),
      nome: newName,
      tipo: newType,
      citta: newCity,
      zona: newZona,
      target: newTarget,
      prezzoMedio: newPrezzo,
      rating: newRating,
      puntiForza: ["Flessibilita' di budget", "Staff giovanile"],
      puntiDeboli: ["Brand nuovo nel territorio"],
      sito: `${newName.toLowerCase().replace(/\s+/g, "")}.it`,
      instagram: `@${newName.toLowerCase().replace(/\s+/g, "_")}`,
      materiali: 0,
      ultimoAggiornamento: new Date().toISOString().substring(0, 10),
    };
    setCompetitors([...competitors, newComp]);
    setNewName("");
    setShowAddModal(false);
  };

  // Handles mock upload adding item to list in D2
  const handleFakeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      const newFile: DemoFile = {
        id: Date.now(),
        nome: fileName,
        comp: selectedCompForAI === "Tutti" ? "Competitor Generico" : selectedCompForAI,
        size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
        data: new Date().toLocaleDateString("it-IT"),
        stato: "caricato"
      };
      setFiles(prev => [newFile, ...prev]);
      setUploadMessage(`File "${fileName}" caricato nello stato: CARICATO. (Simulazione)`);
      setTimeout(() => setUploadMessage(null), 4000);
    }
  };

  // Interactive mock analysis trigger for D2 files
  const triggerFileAnalysis = (id: number) => {
    setAnalyzingFileId(id);
    setTimeout(() => {
      setFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, stato: "analizzato" } : f))
      );
      setAnalyzingFileId(null);
      setUploadMessage("Analisi del file completata con successo! Stato aggiornato ad ANALIZZATO.");
      setTimeout(() => setUploadMessage(null), 4000);
    }, 1500);
  };

  // Interactive mock AI Analysis report generation for D3
  const handleGenerateAI = () => {
    if (!prompt.trim()) return;
    setIsGeneratingAI(true);
    setAiReport(null);
    setTimeout(() => {
      setIsGeneratingAI(false);
      const isPricing = prompt.toLowerCase().includes("prezzo") || prompt.toLowerCase().includes("tariffa");
      const isProposal = prompt.toLowerCase().includes("proposta") || prompt.toLowerCase().includes("brochure");
      const compName = selectedCompForAI === "Tutti" ? "Villa Reale Events" : selectedCompForAI;
      const compObj = competitors.find(c => c.nome === compName) || competitors[0];

      if (isPricing) {
        setAiReport({
          tipo: "Analisi Prezzi",
          vantaggi: `Offriamo una tariffa media di € 100/pax contro i € ${compObj.prezzoMedio}/pax di ${compName}. La nostra flessibilita' nel preventivare eventi infrasettimanali e' superiore del 35%.`,
          puntiAttenzione: `${compName} attrae clienti alto-spendenti grazie alla sua zona prestigiosa (${compObj.zona}) e al forte posizionamento sul target ${compObj.target}.`,
          pricingConsigliato: `Mantenere il pacchetto base a € 95/pax ma aggiungere un pacchetto 'All-Inclusive Premium' a € 135/pax per erodere quote a ${compName} nel weekend.`,
          azioniImmediate: "Formare lo staff commerciale a confrontare direttamente il nostro preventivo finito esente da fee d'affitto con i costi addizionali del competitor."
        });
      } else if (isProposal) {
        setAiReport({
          tipo: "Analisi Proposta Commerciale",
          vantaggi: "Il nostro portale web genera proposte commerciali interattive in tempo reale con firma digitale. La brochure del competitor e' un PDF statico inviato via mail con diversi giorni di ritardo.",
          puntiAttenzione: `La brochure di ${compName} include foto ad altissima risoluzione dei matrimoni e un portfolio esteso di case history per il target ${compObj.target}.`,
          pricingConsigliato: "Proporre preventivi digitali corredati da una mini-gallery personalizzata basata sulla tipologia dell'evento del cliente.",
          azioniImmediate: "Configurare il co-branding per presentazioni commerciali istantanee da inviare su WhatsApp durante il primo contatto telefonico."
        });
      } else {
        setAiReport({
          tipo: "Punti Deboli Concorrenza",
          vantaggi: `Copriamo le richieste di prenotazione 24 ore su 24 con l'AI assistant di ZAK. ${compName} soffre di lunghi tempi di risposta (fino a 48 ore) nel weekend e non ha una chat diretta.`,
          puntiAttenzione: `Il competitor vanta ottimi punti di forza come: ${compObj.puntiForza.join(", ")}.`,
          pricingConsigliato: "Puntare sulla velocita' di reazione: inserire la CTA 'Ricevi Proposta in 5 minuti' sul nostro sito web per agganciare i clienti insoddisfatti dei loro ritardi.",
          azioniImmediate: `Sottolineare le criticita' note di ${compName} (${compObj.puntiDeboli.join(" e ")}) per posizionarci come partner piu' affidabile.`
        });
      }
    }, 1500);
  };

  // Handles clicking a co-branding template in D4 to prefill Pitch Generator
  const selectTemplateForPitch = (tpl: CoBrandingTemplate) => {
    setPitchTargetType(tpl.tipo);
    setPitchOrgName(
      tpl.tipo === "scuola" ? "Liceo Scientifico Galilei"
      : tpl.tipo === "universita" ? "Facolta' di Economia UniMi"
      : tpl.tipo === "azienda" ? "TechSolutions S.r.l."
      : tpl.tipo === "palestra" ? "ASD Fit Club Milano"
      : "Eventi Premium Milano"
    );
    setPitchDescription(tpl.messaggio);
    setPitchAdvantages(tpl.vantaggi);
    setPitchGuests(tpl.tipo === "azienda" ? 120 : tpl.tipo === "scuola" ? 200 : 80);
    setPitchBudget(tpl.tipo === "azienda" ? 8000 : tpl.tipo === "scuola" ? 4000 : 3500);

    // Switch pitch preview structure
    const affittoBase = tpl.tipo === "scuola" ? 1200 : tpl.tipo === "azienda" ? 2500 : tpl.tipo === "universita" ? 1800 : 1500;
    const cateringPerHead = tpl.tipo === "scuola" ? 15 : tpl.tipo === "azienda" ? 35 : 25;
    const totaleStima = affittoBase + (100 * cateringPerHead);

    setPitchGenerated({
      titolo: `Proposta: ${tpl.titolo}`,
      descrizione: tpl.messaggio,
      prezzoBase: affittoBase,
      prezzoCatering: 100 * cateringPerHead,
      totale: totaleStima,
      sottoBudget: totaleStima <= 6000,
      vantaggi: tpl.vantaggi,
      cta: tpl.cta
    });

    // Scroll to pitch preview section gently
    const element = document.getElementById("pitch-generator-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Custom B2B Pitch Proposal Form Generation
  const handleGeneratePitch = () => {
    let affittoBase = pitchTargetType === "scuola" ? 1200 : pitchTargetType === "azienda" ? 2500 : pitchTargetType === "universita" ? 1800 : 1500;
    let cateringPerHead = pitchTargetType === "scuola" ? 15 : pitchTargetType === "azienda" ? 35 : 25;
    let totaleStima = affittoBase + (pitchGuests * cateringPerHead);

    setPitchGenerated({
      titolo: `Proposta Commerciale per ${pitchOrgName}`,
      descrizione: pitchDescription,
      prezzoBase: affittoBase,
      prezzoCatering: pitchGuests * cateringPerHead,
      totale: totaleStima,
      sottoBudget: totaleStima <= pitchBudget,
      vantaggi: pitchAdvantages,
      cta: "Accetta Proposta B2B"
    });
  };

  // Simulated PDF / Presentation Exporter (Task D5)
  const triggerExport = (type: "pdf" | "presentation") => {
    setExportType(type);
    setExportProgress(0);
    setExportStatusText("Preparazione dell'esportazione...");

    const steps = [
      { p: 15, text: "Caricamento template grafico..." },
      { p: 35, text: "Recupero dati competitor e pricing..." },
      { p: 60, text: "Impaginazione layout grafico in corso..." },
      { p: 85, text: "Generazione file e compressione..." },
      { p: 100, text: "Pronto per il download!" },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setExportProgress(step.p);
        setExportStatusText(step.text);
      }, (idx + 1) * 550);
    });
  };

  // Filtered Competitors List based on search and selected category filter (Task D1)
  const filteredCompetitors = competitors.filter(c => {
    const matchesSearch = `${c.nome} ${c.citta} ${c.zona} ${c.target}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "Tutti" || c.tipo === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Extract unique competitor categories for filter
  const competitorCategories = ["Tutti", ...Array.from(new Set(competitors.map(c => c.tipo)))];

  // Presentation Slide Content for preview (Task D5)
  const previewSlides = [
    {
      titolo: "Slide 1: Copertina Proposta B2B",
      sottotitolo: pitchOrgName || "Organizzazione Partner",
      content: "Unione tra Eccellenza Tecnologica e Location di Prestigio. Soluzione su misura configurata da ZAK AI Ecosystem.",
      layout: "bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white"
    },
    {
      titolo: "Slide 2: I Dettagli del Servizio",
      sottotitolo: "Cosa e' incluso nell'offerta",
      content: pitchDescription || "Noleggio esclusivo del locale, catering dedicato, servizi di accoglienza e coordinatore dell'evento per garantire il massimo successo.",
      layout: "bg-slate-900 text-slate-100"
    },
    {
      titolo: "Slide 3: Analisi Comparativa di Mercato",
      sottotitolo: "Il vantaggio strategico",
      content: "La nostra venue offre un risparmio del 15% rispetto ai concorrenti storici locali, garantendo risposte immediate ed esecuzione impeccabile.",
      layout: "bg-indigo-950 text-indigo-100"
    },
    {
      titolo: "Slide 4: Dettaglio Pricing Trasparente",
      sottotitolo: "Costo stimato complessivo",
      content: `Totale stimato: € ${pitchGenerated ? pitchGenerated.totale : 5000} (Catering + quota affitto). Condizioni trasparenti senza spese accessorie nascoste.`,
      layout: "bg-slate-950 text-slate-100 border border-indigo-500/20"
    },
    {
      titolo: "Slide 5: Prossimi Passi & Call To Action",
      sottotitolo: "Conferma la data",
      content: `Contatta lo staff per l'opzione gratuita o conferma online. Azione richiesta: "${pitchGenerated ? pitchGenerated.cta : "Accetta Proposta"}"`,
      layout: "bg-gradient-to-r from-violet-950 to-indigo-950 text-white"
    }
  ];

  return (
    <SidebarLayout>
      <div className="space-y-8 p-8 max-w-7xl mx-auto">
        
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground">B2B & Competitor</h1>
              <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-600 bg-indigo-500/5">
                Spazio Demo Avanzato
              </Badge>
            </div>
            <p className="mt-1.5 text-muted-foreground">
              Monitora i concorrenti locali, analizza listini con AI e redigi pacchetti B2B per scuole, universita' e aziende.
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="w-fit flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" /> Aggiungi Competitor
          </Button>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-950">
              <Building2 className="h-5 w-5" />
              Archivio competitor reale
            </CardTitle>
            <CardDescription>
              Dati salvati su database tramite API OpenAPI-first. Il sandbox sotto resta disponibile per prototipi AI e pitch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
              <Input
                placeholder="Nome competitor"
                value={realName}
                onChange={(event) => setRealName(event.target.value)}
              />
              <Input
                placeholder="Citta"
                value={realCity}
                onChange={(event) => setRealCity(event.target.value)}
              />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={realCategory}
                onChange={(event) => setRealCategory(event.target.value)}
              >
                <option value="location_eventi">Location eventi</option>
                <option value="catering">Catering</option>
                <option value="club">Club</option>
                <option value="agenzia_eventi">Agenzia eventi</option>
              </select>
              <Button onClick={() => void addRealCompetitor()} disabled={createRealCompetitor.isPending || !realName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Salva reale
              </Button>
            </div>
            <Input
              placeholder="Cerca nel database reale..."
              value={realSearch}
              onChange={(event) => setRealSearch(event.target.value)}
            />
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Citta</TableHead>
                    <TableHead>Ultimo update</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realCompetitorsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Caricamento archivio reale...</TableCell>
                    </TableRow>
                  ) : realCompetitors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Nessun competitor reale salvato.</TableCell>
                    </TableRow>
                  ) : realCompetitors.map((competitor) => (
                    <TableRow key={competitor.id}>
                      <TableCell className="font-medium">{competitor.nome}</TableCell>
                      <TableCell>{competitor.categoria}</TableCell>
                      <TableCell>{competitor.citta || "-"}</TableCell>
                      <TableCell>{new Date(competitor.data_aggiornamento).toLocaleDateString("it-IT")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => void removeRealCompetitor(competitor.id)}
                          disabled={deleteRealCompetitor.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 border-t pt-4 md:grid-cols-[1fr_1fr_1fr_auto]">
              <Input
                placeholder="Nome materiale o file"
                value={materialName}
                onChange={(event) => setMaterialName(event.target.value)}
              />
              <Input
                placeholder="URL o riferimento file"
                value={materialUrl}
                onChange={(event) => setMaterialUrl(event.target.value)}
              />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={materialCompetitorId}
                onChange={(event) => setMaterialCompetitorId(event.target.value)}
              >
                <option value="">Competitor non collegato</option>
                {realCompetitors.map((competitor) => (
                  <option key={competitor.id} value={competitor.id}>{competitor.nome}</option>
                ))}
              </select>
              <Button onClick={() => void addRealMaterial()} disabled={createRealMaterial.isPending || !materialName.trim()}>
                <Upload className="mr-2 h-4 w-4" />
                Registra
              </Button>
            </div>
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materiale</TableHead>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realMaterialsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Caricamento materiali...</TableCell>
                    </TableRow>
                  ) : realMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Nessun materiale reale registrato.</TableCell>
                    </TableRow>
                  ) : realMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.nome_file}</TableCell>
                      <TableCell>{material.competitor_nome || "-"}</TableCell>
                      <TableCell>{material.stato}</TableCell>
                      <TableCell>{new Date(material.data_creazione).toLocaleDateString("it-IT")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => void removeRealMaterial(material.id)}
                          disabled={deleteRealMaterial.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 border-t pt-4 md:grid-cols-[1fr_180px_1.4fr_auto]">
              <Input
                placeholder="Titolo template"
                value={templateTitle}
                onChange={(event) => setTemplateTitle(event.target.value)}
              />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={templateTarget}
                onChange={(event) => setTemplateTarget(event.target.value)}
              >
                <option value="azienda">Azienda</option>
                <option value="scuola">Scuola</option>
                <option value="universita">Universita</option>
                <option value="agenzia">Agenzia</option>
              </select>
              <Input
                placeholder="Messaggio commerciale base"
                value={templateMessage}
                onChange={(event) => setTemplateMessage(event.target.value)}
              />
              <Button
                onClick={() => void addRealTemplate()}
                disabled={createRealTemplate.isPending || !templateTitle.trim() || !templateMessage.trim()}
              >
                <Handshake className="mr-2 h-4 w-4" />
                Salva template
              </Button>
            </div>
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Messaggio</TableHead>
                    <TableHead>Utilizzi</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realTemplatesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Caricamento template...</TableCell>
                    </TableRow>
                  ) : realTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Nessun template B2B reale salvato.</TableCell>
                    </TableRow>
                  ) : realTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.titolo}</TableCell>
                      <TableCell>{template.target_tipo}</TableCell>
                      <TableCell className="max-w-[420px] truncate">{template.messaggio}</TableCell>
                      <TableCell>{template.utilizzi}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => void removeRealTemplate(template.id)}
                          disabled={deleteRealTemplate.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-4 border-t pt-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold">Analisi competitor reale</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={realAnalysisCompetitorId}
                    onChange={(event) => setRealAnalysisCompetitorId(event.target.value)}
                  >
                    <option value="">Scenario generale</option>
                    {realCompetitors.map((competitor) => (
                      <option key={competitor.id} value={competitor.id}>{competitor.nome}</option>
                    ))}
                  </select>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={realAnalysisFocus}
                    onChange={(event) => setRealAnalysisFocus(event.target.value as typeof realAnalysisFocus)}
                  >
                    <option value="generale">Generale</option>
                    <option value="prezzo">Prezzo</option>
                    <option value="proposta">Proposta</option>
                    <option value="debolezze">Debolezze</option>
                  </select>
                  <Button onClick={() => void runRealAnalysis()} disabled={analyzeRealCompetitor.isPending}>
                    {analyzeRealCompetitor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Genera
                  </Button>
                </div>
                {realAnalysisResult ? (
                  <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs leading-relaxed">
                    <p className="font-semibold">{realAnalysisResult.titolo}</p>
                    <p className="mt-1 text-muted-foreground">{realAnalysisResult.sintesi}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="font-semibold text-emerald-700">Opportunita</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {realAnalysisResult.opportunita.map((item: string) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-700">Azioni</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {realAnalysisResult.azioni_consigliate.map((item: string) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Usa il prompt nel tab Analisi AI oppure genera una valutazione standard.</p>
                )}
              </div>

              <div className="rounded-lg border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileDown className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold">Export B2B reale</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void runRealExport("pdf")}
                    disabled={exportRealPitch.isPending}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Outline PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void runRealExport("presentazione")}
                    disabled={exportRealPitch.isPending}
                  >
                    <Presentation className="mr-2 h-4 w-4" />
                    Outline slide
                  </Button>
                </div>
                {realExportResult ? (
                  <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{realExportResult.titolo}</p>
                      <Badge variant="outline">{realExportResult.download_filename}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {realExportResult.slides.map((slide: { titolo: string; contenuto: string }) => (
                        <div key={slide.titolo} className="rounded border bg-background p-2">
                          <p className="font-semibold">{slide.titolo}</p>
                          <p className="text-muted-foreground">{slide.contenuto}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Genera un outline JSON/PDF-ready dal template B2B o dalla proposta corrente.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- TABS --- */}
        <Tabs defaultValue="archivio" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-[650px] bg-muted/60 p-1 rounded-lg">
            <TabsTrigger value="archivio">Archivio Competitor</TabsTrigger>
            <TabsTrigger value="materiali">Materiali & Brochure</TabsTrigger>
            <TabsTrigger value="analisi">Assistente AI Analisi</TabsTrigger>
            <TabsTrigger value="pitch">Template & Proposte B2B</TabsTrigger>
          </TabsList>

          {/* ─── TAB: Archivio Competitor (Task D1) ─── */}
          <TabsContent value="archivio" className="space-y-6">
            <Card className="border-border">
              <CardHeader className="pb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Mappa Competitor Locali</CardTitle>
                  <CardDescription>Confronto delle strutture concorrenti censite sul territorio di riferimento.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-background text-foreground border border-border text-xs rounded-lg px-3 py-2 w-full sm:w-48 appearance-none pr-8 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      {competitorCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat === "Tutti" ? "Tutte le categorie" : cat}</option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {/* Text Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per nome, zona o target..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted/40 text-xs">
                      <TableRow>
                        <TableHead className="font-bold">Competitor</TableHead>
                        <TableHead className="font-bold">Zona & Citta'</TableHead>
                        <TableHead className="font-bold">Target Clienti</TableHead>
                        <TableHead className="font-bold">Prezzo Medio</TableHead>
                        <TableHead className="font-bold">Rating</TableHead>
                        <TableHead className="font-bold">Materiali</TableHead>
                        <TableHead className="text-right font-bold">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {filteredCompetitors.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-foreground">
                            <div className="font-bold">{c.nome}</div>
                            <span className="text-[10px] text-indigo-500 font-medium">{c.tipo}</span>
                          </TableCell>
                          <TableCell>
                            <div>{c.zona}</div>
                            <div className="text-[10px] text-muted-foreground">{c.citta}</div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-[10px] font-medium">
                              {c.target}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            € {c.prezzoMedio} / pax
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                              <Star className="w-3 h-3 fill-amber-500" /> {c.rating}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-indigo-500/75" />
                              {c.materiali} file
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedComp(c)}
                              className="text-xs border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/5"
                            >
                              Dettagli <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCompetitors.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            Nessun competitor corrisponde ai filtri selezionati.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Materiali & Brochure (Task D2) ─── */}
          <TabsContent value="materiali" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Documenti e Listini Concorrenti</CardTitle>
                <CardDescription>Raccogli cataloghi, foto e PDF dei competitor. L'AI analizza i documenti per rilevare i dettagli delle offerte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Simulated interactive dropzone */}
                <div className="relative border-2 border-dashed border-indigo-500/30 rounded-2xl p-8 text-center bg-indigo-500/[0.01] hover:bg-indigo-500/[0.03] transition-colors cursor-pointer group">
                  <input
                    type="file"
                    onChange={handleFakeUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3 group-hover:scale-105 transition-transform" />
                  <p className="text-sm font-bold text-foreground">Trascina qui i listini dei competitor o fai clic per selezionare un file</p>
                  <p className="text-xs text-muted-foreground mt-1.5">Accetta PDF, PNG, JPG, DOCX (Dimensione massima: 20MB)</p>
                </div>

                {uploadMessage && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{uploadMessage}</span>
                  </div>
                )}

                {/* File list with status indicators */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" /> Archivio Documenti Caricati
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((f) => (
                      <div key={f.id} className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between gap-3 hover:shadow-md transition-shadow relative overflow-hidden">
                        
                        {/* Decorative Top Accent depending on status */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${
                          f.stato === "analizzato" ? "bg-emerald-500" : f.stato === "da analizzare" ? "bg-amber-500" : "bg-blue-500"
                        }`} />

                        <div className="pt-1">
                          <div className="flex justify-between items-start gap-2">
                            <FileText className="w-7 h-7 text-indigo-500 shrink-0" />
                            {/* Status badge */}
                            <Badge className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${
                              f.stato === "analizzato" ? "bg-emerald-500/5 text-emerald-700 border-emerald-500/20"
                              : f.stato === "da analizzare" ? "bg-amber-500/5 text-amber-700 border-amber-500/20"
                              : "bg-blue-500/5 text-blue-700 border-blue-500/20"
                            }`}>
                              {f.stato}
                            </Badge>
                          </div>
                          <h4 className="text-xs font-bold text-foreground mt-2 truncate" title={f.nome}>{f.nome}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{f.comp}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-3.5 text-[10px] text-muted-foreground">
                          <span>{f.size} · {f.data}</span>
                          <div className="flex gap-2">
                            {f.stato !== "analizzato" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={analyzingFileId === f.id}
                                onClick={() => triggerFileAnalysis(f.id)}
                                className="h-6 px-2 text-[10px] text-indigo-600 hover:bg-indigo-500/5 font-bold flex items-center gap-1"
                              >
                                {analyzingFileId === f.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" /> Analisi...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3" /> Analizza
                                  </>
                                )}
                              </Button>
                            )}
                            <button className="text-muted-foreground hover:text-foreground" title="Apri File">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="text-muted-foreground hover:text-rose-500" title="Elimina">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Analisi AI (Task D3) ─── */}
          <TabsContent value="analisi" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <CardTitle className="text-lg font-bold font-sans">Assistente Strategico Competitor AI</CardTitle>
                </div>
                <CardDescription>Genera report e scenari strategici per confrontare la tua venue con la concorrenza.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Select Competitor and Library templates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seleziona Competitor</label>
                      <select
                        value={selectedCompForAI}
                        onChange={(e) => setSelectedCompForAI(e.target.value)}
                        className="w-full bg-background border border-border text-xs rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Tutti">Tutti i Competitor (Media)</option>
                        {competitors.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Libreria Prompt AI</label>
                      <div className="space-y-2">
                        {promptTemplates.map((t, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPrompt(t.text)}
                            className="p-3 border border-border rounded-xl bg-muted/20 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all cursor-pointer text-xs"
                          >
                            <h4 className="font-bold text-foreground flex items-center gap-1.5">
                              <Sparkle className="w-3.5 h-3.5 text-indigo-500" /> {t.titolo}
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t.descrizione}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4 border-l border-border pl-0 md:pl-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prompt di Analisi Personalizzato</label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Seleziona un template a sinistra o scrivi qui le tue richieste specifiche..."
                        className="w-full bg-background border border-border text-xs rounded-lg p-3.5 h-44 focus:outline-none focus:border-indigo-500 resize-none text-foreground font-mono"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI || !prompt.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Elaborazione AI in corso (Simulata)...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Genera Analisi Competitiva AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* AI report output preview */}
                {aiReport && (
                  <div className="rounded-xl border border-border bg-card p-6 space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h4 className="text-xs font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500" /> Report AI Generato: {aiReport.tipo}
                      </h4>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-700 bg-emerald-500/5">
                        Pronto
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="p-4 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/10 space-y-2">
                        <h5 className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Nostro Vantaggio Competitivo
                        </h5>
                        <p className="text-muted-foreground">{aiReport.vantaggi}</p>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-amber-500/[0.02] border border-amber-500/10 space-y-2">
                        <h5 className="font-bold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Punti Critici del Competitor
                        </h5>
                        <p className="text-muted-foreground">{aiReport.puntiAttenzione}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-indigo-500/[0.02] border border-indigo-500/10 space-y-2">
                        <h5 className="font-bold text-indigo-700 flex items-center gap-1">
                          <Briefcase className="w-4 h-4" /> Strategia Pricing Consigliata
                        </h5>
                        <p className="text-muted-foreground">{aiReport.pricingConsigliato}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-500/[0.02] border border-slate-500/10 space-y-2">
                        <h5 className="font-bold text-slate-700 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Azione Immediata per lo Staff
                        </h5>
                        <p className="text-muted-foreground">{aiReport.azioniImmediate}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Template Co-branding (Task D4) ─── */}
          <TabsContent value="pitch" className="space-y-6">
            
            {/* Co-Branding Templates */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Libreria Template Co-Branding B2B</CardTitle>
                <CardDescription>Scegli un modello pre-configurato per la categoria target. Clicca su 'Usa Template' per precompilare il preventivo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {initialTemplates.map((t) => {
                    const Icon = t.tipo === "scuola" ? GraduationCap
                               : t.tipo === "universita" ? GraduationCap
                               : t.tipo === "azienda" ? Briefcase
                               : t.tipo === "palestra" ? Handshake
                               : Handshake;
                    const iconStyle = t.tipo === "scuola" ? "bg-amber-500/10 text-amber-600"
                                    : t.tipo === "universita" ? "bg-violet-500/10 text-violet-600"
                                    : t.tipo === "azienda" ? "bg-blue-500/10 text-blue-600"
                                    : "bg-emerald-500/10 text-emerald-600";
                    return (
                      <div key={t.id} className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className={`p-2 rounded-lg ${iconStyle}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
                            {t.tipo}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{t.titolo}</h4>
                          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{t.messaggio}</p>
                          <div className="mt-3 space-y-1">
                            {t.vantaggi.map((v, i) => (
                              <div key={i} className="text-[10px] text-foreground flex items-center gap-1.5 font-medium">
                                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-border pt-3.5 flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>Usato {t.usato} volte</span>
                          <Button
                            onClick={() => selectTemplateForPitch(t)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-indigo-600 font-bold hover:bg-indigo-500/5 flex items-center gap-0.5"
                          >
                            Usa Template <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pitch Generator Section */}
            <div id="pitch-generator-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Form Input */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Generatore Pitch & Proposta B2B</CardTitle>
                  <CardDescription>Configura i dettagli del contatto partner per calcolare preventivi e generare esportazioni.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Tipo Partner</label>
                      <select
                        value={pitchTargetType}
                        onChange={(e) => setPitchTargetType(e.target.value)}
                        className="w-full bg-background border border-border text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                      >
                        <option value="scuola">Scuole Superiori</option>
                        <option value="universita">Universita'</option>
                        <option value="azienda">Azienda</option>
                        <option value="palestra">Palestre & Associazioni</option>
                        <option value="agenzia">Agenzie di Eventi</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Nome Organizzazione</label>
                      <Input
                        value={pitchOrgName}
                        onChange={(e) => setPitchOrgName(e.target.value)}
                        placeholder="Es. Deloitte S.p.A."
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Numero Invitati</label>
                      <Input
                        type="number"
                        value={pitchGuests}
                        onChange={(e) => setPitchGuests(Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Budget Massimale (€)</label>
                      <Input
                        type="number"
                        value={pitchBudget}
                        onChange={(e) => setPitchBudget(Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Messaggio / Dettagli Servizio</label>
                    <textarea
                      value={pitchDescription}
                      onChange={(e) => setPitchDescription(e.target.value)}
                      placeholder="Descrivi la struttura del servizio proposto..."
                      className="w-full bg-background border border-border text-xs rounded-lg p-3 h-20 focus:outline-none focus:border-indigo-500 resize-none text-foreground"
                    />
                  </div>

                  <Button onClick={handleGeneratePitch} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9">
                    Genera Proposta
                  </Button>
                </CardContent>
              </Card>

              {/* Pitch output, presentation slides preview, and export simulation */}
              {pitchGenerated ? (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">{pitchGenerated.titolo}</CardTitle>
                        <CardDescription>Bozza generata ed esportabile (Dati locali)</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => triggerExport("pdf")}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px] font-bold border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/5 flex items-center gap-1"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Esporta PDF
                        </Button>
                        <Button
                          onClick={() => triggerExport("presentation")}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px] font-bold border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/5 flex items-center gap-1"
                        >
                          <Presentation className="w-3.5 h-3.5" /> Esporta Slide
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    
                    {/* Slideshow interactive preview (Task D5) */}
                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      <div className="p-1 bg-muted/60 flex items-center justify-between text-[10px] text-muted-foreground px-3">
                        <span className="font-bold">ANTEPRIMA DI ESPORTAZIONE (SLIDE {currentSlide + 1}/5)</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentSlide(prev => (prev > 0 ? prev - 1 : 4))}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setCurrentSlide(prev => (prev < 4 ? prev + 1 : 0))}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className={`p-6 min-h-[140px] flex flex-col justify-between transition-all duration-300 ${previewSlides[currentSlide].layout}`}>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-bold opacity-75">{previewSlides[currentSlide].titolo}</span>
                          <h4 className="text-sm font-bold mt-1">{previewSlides[currentSlide].sottotitolo}</h4>
                        </div>
                        <p className="text-[11px] mt-3 opacity-90 leading-relaxed font-sans">{previewSlides[currentSlide].content}</p>
                      </div>
                    </div>

                    {/* Pricing Detail Table */}
                    <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2">
                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span>Affitto sala base:</span>
                        <span className="font-bold text-foreground">€ {pitchGenerated.prezzoBase}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span>Catering e servizi:</span>
                        <span className="font-bold text-foreground">€ {pitchGenerated.prezzoCatering}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-sm">
                        <span>Costo complessivo stimato:</span>
                        <span className="text-indigo-600">€ {pitchGenerated.totale}</span>
                      </div>
                    </div>

                    {/* Budget Warning / Approval indicator */}
                    <div className={`p-3 rounded-lg flex items-center gap-2 font-medium border ${
                      pitchGenerated.sottoBudget
                        ? "bg-emerald-500/[0.03] border-emerald-500/10 text-emerald-700"
                        : "bg-amber-500/[0.03] border-amber-500/10 text-amber-700"
                    }`}>
                      <Info className="w-4 h-4 shrink-0" />
                      <span>
                        {pitchGenerated.sottoBudget
                          ? `Il costo stimato rientra ampiamente nel budget di spesa indicato (${pitchBudget} €).`
                          : `Attenzione: l'importo stimato supera il budget del partner di ${pitchGenerated.totale - pitchBudget} €.`}
                      </span>
                    </div>

                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-xs bg-muted/10">
                  <div className="max-w-xs space-y-2">
                    <FileText className="w-8 h-8 text-indigo-500/40 mx-auto" />
                    <p className="font-bold">Nessuna proposta generata</p>
                    <p className="text-[11px]">Compila il modulo a sinistra o seleziona un template co-branding sopra per visualizzare l'anteprima.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* --- CUSTOM MODAL FOR DETAIL CARD VIEW --- */}
        {selectedComp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-4 text-xs text-foreground">
              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedComp.nome}</h3>
                  <p className="text-[10px] text-muted-foreground">{selectedComp.tipo} — {selectedComp.citta}</p>
                </div>
                <button
                  onClick={() => setSelectedComp(null)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Zona Locale</span>
                  <span className="font-semibold text-foreground text-xs">{selectedComp.zona}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Target Primario</span>
                  <span className="font-semibold text-foreground text-xs">{selectedComp.target}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Prezzo Medio Stimato</span>
                  <span className="font-bold text-indigo-600 text-xs">€ {selectedComp.prezzoMedio} / pax</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Rating Commerciale</span>
                  <span className="inline-flex items-center gap-1 text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                    <Star className="w-3 h-3 fill-amber-500" /> {selectedComp.rating}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div>Sito: <a href="#" className="text-indigo-600 underline font-medium">{selectedComp.sito}</a></div>
                <div>Instagram: <span className="font-medium text-foreground">{selectedComp.instagram}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Punti di forza</span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-normal">
                    {selectedComp.puntiForza.map((p, idx) => <li key={idx}>{p}</li>)}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Punti deboli</span>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-normal">
                    {selectedComp.puntiDeboli.map((p, idx) => <li key={idx}>{p}</li>)}
                  </ul>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-end gap-2">
                <Button onClick={() => setSelectedComp(null)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 h-8 text-xs">
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- CUSTOM MODAL FOR ADDING COMPETITOR --- */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <form onSubmit={handleAddCompetitor} className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl space-y-4 text-xs text-foreground">
              <div className="flex justify-between items-start border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Aggiungi Nuovo Competitor</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Nome Competitor</label>
                  <Input
                    placeholder="Es. Terrazza Duomo Milano"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Categoria / Tipo</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full bg-background border border-border text-xs rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Location eventi">Location eventi</option>
                      <option value="Spazio eventi moderno">Spazio eventi moderno</option>
                      <option value="Club all'aperto">Club all'aperto</option>
                      <option value="Location storica">Location storica</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Citta'</label>
                    <Input
                      placeholder="Es. Milano"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Zona</label>
                    <Input
                      placeholder="Es. Navigli"
                      value={newZona}
                      onChange={(e) => setNewZona(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Target Clientela</label>
                    <Input
                      placeholder="Es. Feste & Lauree"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Prezzo Pax (€)</label>
                    <Input
                      type="number"
                      value={newPrezzo}
                      onChange={(e) => setNewPrezzo(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Rating (1.0 - 5.0)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="h-8 text-xs font-bold">
                  Annulla
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs px-4">
                  Salva Competitor
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* --- EXPORT SIMULATION PROGRESS MODAL (Task D5) --- */}
        {exportProgress !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5 text-xs text-foreground text-center">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Generazione {exportType === "pdf" ? "PDF A4" : "Presentazione Slide"}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">Connettore export pipeline (Simulatore ZAK)</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>{exportStatusText}</span>
                  <span>{exportProgress}%</span>
                </div>
              </div>

              {exportProgress === 100 ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Esportazione completata con successo!</span>
                  </div>
                  <Button
                    onClick={() => setExportProgress(null)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs"
                  >
                    Chiudi
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium pt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Configurazione delle pagine in corso...</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}
