import { useState } from "react";
import {
  Building2,
  Upload,
  Search,
  Sparkles,
  FileText,
  Eye,
  Trash2,
  Plus,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Globe,
  Instagram,
  Star,
  ChevronRight,
  ArrowUpRight,
  Handshake,
  GraduationCap,
  Briefcase,
  Download,
} from "lucide-react";

/* ────────────────────────────────────────────────────
   Demo data
   ──────────────────────────────────────────────────── */

interface Competitor {
  id: number;
  nome: string;
  tipo: string;
  citta: string;
  rating: number;
  puntiForza: string[];
  puntiDeboli: string[];
  sito: string;
  instagram: string;
  materiali: number;
  ultimoAggiornamento: string;
}

const competitorDemo: Competitor[] = [
  {
    id: 1,
    nome: "Villa Reale Events",
    tipo: "Location eventi",
    citta: "Milano",
    rating: 4.5,
    puntiForza: ["Location prestigiosa", "Servizio catering interno", "Parcheggio ampio"],
    puntiDeboli: ["Prezzi elevati", "Disponibilità limitata"],
    sito: "villarealeevents.it",
    instagram: "@villareale_events",
    materiali: 5,
    ultimoAggiornamento: "2026-05-28",
  },
  {
    id: 2,
    nome: "Loft Experience",
    tipo: "Spazio eventi",
    citta: "Roma",
    rating: 4.2,
    puntiForza: ["Design moderno", "Flessibilità layout", "DJ resident"],
    puntiDeboli: ["Zona periferica", "Capienza limitata 150 pax"],
    sito: "loftexperience.it",
    instagram: "@loft_experience",
    materiali: 3,
    ultimoAggiornamento: "2026-05-15",
  },
  {
    id: 3,
    nome: "Garden Party Club",
    tipo: "Club all'aperto",
    citta: "Napoli",
    rating: 3.8,
    puntiForza: ["Spazio esterno ampio", "Prezzi competitivi", "Bar interno"],
    puntiDeboli: ["Stagionale", "Audio non eccellente", "Manca catering"],
    sito: "gardenpartyclub.it",
    instagram: "@gardenparty_na",
    materiali: 2,
    ultimoAggiornamento: "2026-04-20",
  },
  {
    id: 4,
    nome: "Palazzo Blu Ricevimenti",
    tipo: "Location storica",
    citta: "Firenze",
    rating: 4.7,
    puntiForza: ["Atmosfera unica", "Staff dedicato", "Cucina stellata"],
    puntiDeboli: ["Budget minimo alto", "Solo weekend"],
    sito: "palazzoblu.it",
    instagram: "@palazzoblu_fi",
    materiali: 7,
    ultimoAggiornamento: "2026-05-30",
  },
];

interface Template {
  id: number;
  nome: string;
  tipo: "scuola" | "azienda" | "partner";
  descrizione: string;
  usato: number;
}

const templateDemo: Template[] = [
  {
    id: 1,
    nome: "Proposta Scuole Superiori",
    tipo: "scuola",
    descrizione: "Pacchetto feste di diploma con prezzi agevolati, menu studentesco e DJ set incluso",
    usato: 12,
  },
  {
    id: 2,
    nome: "Corporate Team Building",
    tipo: "azienda",
    descrizione: "Evento aziendale con sala meeting, catering business e area networking",
    usato: 8,
  },
  {
    id: 3,
    nome: "Partnership Locale",
    tipo: "partner",
    descrizione: "Co-branding con venue partner: divisione costi, promozione incrociata, referral",
    usato: 5,
  },
  {
    id: 4,
    nome: "Proposta Università",
    tipo: "scuola",
    descrizione: "Pacchetto lauree e feste universitarie con open bar, allestimento a tema e foto",
    usato: 15,
  },
];

/* ────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────── */

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? "text-amber-400 fill-amber-400" : i < rating ? "text-amber-400 fill-amber-400 opacity-50" : "text-gray-600"}`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-400 font-medium">{rating}</span>
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-5 backdrop-blur-sm">
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}20` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function CompetitorRow({
  c,
  onSelect,
}: {
  c: Competitor;
  onSelect: (c: Competitor) => void;
}) {
  return (
    <tr
      className="group border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer"
      onClick={() => onSelect(c)}
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
            {c.nome[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{c.nome}</p>
            <p className="text-xs text-gray-500">{c.tipo}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-gray-400">{c.citta}</td>
      <td className="py-3.5 px-4">
        <StarRating rating={c.rating} />
      </td>
      <td className="py-3.5 px-4">
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <FileText className="w-3.5 h-3.5" />
          {c.materiali}
        </span>
      </td>
      <td className="py-3.5 px-4 text-xs text-gray-500">{c.ultimoAggiornamento}</td>
      <td className="py-3.5 px-4 text-right">
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors inline-block" />
      </td>
    </tr>
  );
}

function CompetitorDetail({
  c,
  onClose,
}: {
  c: Competitor;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-gray-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-lg font-bold text-violet-300">
              {c.nome[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{c.nome}</h3>
              <p className="text-sm text-gray-400">
                {c.tipo} — {c.citta}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Rating & links */}
        <div className="flex items-center gap-4 mb-5">
          <StarRating rating={c.rating} />
          <a
            href="#"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <Globe className="w-3.5 h-3.5" />
            {c.sito}
          </a>
          <span className="inline-flex items-center gap-1 text-xs text-pink-400">
            <Instagram className="w-3.5 h-3.5" />
            {c.instagram}
          </span>
        </div>

        {/* Strengths / weaknesses */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
              Punti di forza
            </p>
            <ul className="space-y-1.5">
              {c.puntiForza.map((p, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-300 flex items-start gap-2"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-400 mb-2 uppercase tracking-wider">
              Punti deboli
            </p>
            <ul className="space-y-1.5">
              {c.puntiDeboli.map((p, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-300 flex items-start gap-2"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI prompt section */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <p className="text-sm font-semibold text-violet-300">
              Analisi AI
            </p>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Genera un'analisi competitiva automatica basata sui dati raccolti.
            L'AI confronta punti di forza/debolezza, pricing, posizionamento e
            suggerisce strategie di differenziazione.
          </p>
          <button className="mt-3 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Genera analisi competitiva
          </button>
        </div>

        {/* Materiali */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Materiali caricati ({c.materiali})
            </p>
            <button className="text-xs text-violet-400 hover:text-violet-300 inline-flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Carica
            </button>
          </div>
          <div className="space-y-2">
            {["Listino prezzi 2026.pdf", "Brochure eventi.pdf", "Screenshot Instagram.png"].slice(0, Math.min(3, c.materiali)).map((nome, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]"
              >
                <span className="text-xs text-gray-300 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  {nome}
                </span>
                <div className="flex items-center gap-2">
                  <button className="text-gray-500 hover:text-blue-400 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button className="text-gray-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ t }: { t: Template }) {
  const iconMap = {
    scuola: GraduationCap,
    azienda: Briefcase,
    partner: Handshake,
  };
  const colorMap = {
    scuola: "#f59e0b",
    azienda: "#3b82f6",
    partner: "#10b981",
  };
  const Icon = iconMap[t.tipo];
  const color = colorMap[t.tipo];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-5 hover:border-white/[0.12] transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: `${color}15`, color }}
        >
          {t.tipo}
        </span>
      </div>
      <h4 className="text-sm font-bold text-white mb-1">{t.nome}</h4>
      <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
        {t.descrizione}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500">
          Usato {t.usato} volte
        </span>
        <div className="flex items-center gap-1.5">
          <button className="text-gray-500 hover:text-violet-400 transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button className="text-gray-500 hover:text-blue-400 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Main mockup
   ──────────────────────────────────────────────────── */

type TabKey = "archivio" | "materiali" | "ai" | "template";

export default function B2BCompetitorMockup() {
  const [tab, setTab] = useState<TabKey>("archivio");
  const [search, setSearch] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] =
    useState<Competitor | null>(null);

  const filteredCompetitors = competitorDemo.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.citta.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "archivio", label: "Archivio Competitor", icon: Building2 },
    { key: "materiali", label: "Materiali", icon: Upload },
    { key: "ai", label: "Analisi AI", icon: Sparkles },
    { key: "template", label: "Template Co-branding", icon: Handshake },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[Inter,system-ui,sans-serif]">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              B2B & Competitor
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Intelligence competitiva e partnership
            </p>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-lg shadow-violet-500/20">
            <Plus className="w-4 h-4" />
            Nuovo competitor
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Building2}
            label="Competitor monitorati"
            value={competitorDemo.length}
            accent="#8b5cf6"
          />
          <StatCard
            icon={FileText}
            label="Materiali raccolti"
            value={competitorDemo.reduce((s, c) => s + c.materiali, 0)}
            accent="#f59e0b"
          />
          <StatCard
            icon={Target}
            label="Analisi AI generate"
            value={14}
            accent="#ec4899"
          />
          <StatCard
            icon={Users}
            label="Template attivi"
            value={templateDemo.length}
            accent="#10b981"
          />
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex items-center gap-1 mb-6 bg-white/[0.03] rounded-2xl p-1 border border-white/[0.06]">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  tab === t.key
                    ? "bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white shadow-lg shadow-violet-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── TAB: Archivio ─── */}
        {tab === "archivio" && (
          <div>
            {/* Search bar */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cerca competitor per nome o città..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Competitor
                    </th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Città
                    </th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Rating
                    </th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Materiali
                    </th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Aggiornato
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filteredCompetitors.map((c) => (
                    <CompetitorRow
                      key={c.id}
                      c={c}
                      onSelect={setSelectedCompetitor}
                    />
                  ))}
                  {filteredCompetitors.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-sm text-gray-500"
                      >
                        Nessun competitor trovato
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB: Materiali ─── */}
        {tab === "materiali" && (
          <div>
            {/* Upload zone */}
            <div className="rounded-2xl border-2 border-dashed border-violet-500/20 bg-violet-500/[0.04] p-10 text-center mb-6 hover:border-violet-500/40 transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-violet-400 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-semibold text-white mb-1">
                Carica materiali competitor
              </p>
              <p className="text-xs text-gray-500">
                Trascina qui file PDF, immagini o documenti. Max 25 MB per file.
              </p>
              <button className="mt-4 px-5 py-2.5 rounded-xl bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors">
                Seleziona file
              </button>
            </div>

            {/* File grid */}
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Materiali recenti
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { nome: "Listino Villa Reale 2026.pdf", competitor: "Villa Reale Events", tipo: "PDF", size: "2.1 MB", data: "28/05/2026" },
                { nome: "Screenshot menu catering.png", competitor: "Villa Reale Events", tipo: "Immagine", size: "890 KB", data: "28/05/2026" },
                { nome: "Brochure Loft Experience.pdf", competitor: "Loft Experience", tipo: "PDF", size: "4.5 MB", data: "15/05/2026" },
                { nome: "Flyer estivo Garden Party.jpg", competitor: "Garden Party Club", tipo: "Immagine", size: "1.2 MB", data: "20/04/2026" },
                { nome: "Preventivo tipo Palazzo Blu.pdf", competitor: "Palazzo Blu Ricevimenti", tipo: "PDF", size: "1.8 MB", data: "30/05/2026" },
                { nome: "Foto sala principale.jpg", competitor: "Palazzo Blu Ricevimenti", tipo: "Immagine", size: "3.4 MB", data: "30/05/2026" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <FileText className="w-8 h-8 text-violet-400/60" />
                    <span className="text-[10px] font-medium text-gray-500 uppercase">
                      {f.tipo}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white truncate mb-0.5">
                    {f.nome}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">{f.competitor}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-600">
                      {f.size} · {f.data}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-500 hover:text-blue-400 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="text-gray-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: Analisi AI ─── */}
        {tab === "ai" && (
          <div>
            {/* Prompt box */}
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-bold text-white">
                  Prompt AI — Analisi Competitiva
                </h3>
              </div>
              <textarea
                className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/40 resize-none transition-colors"
                rows={4}
                placeholder="Scrivi il tuo prompt. Es: 'Confronta i competitor di Milano evidenziando i nostri punti di differenziazione e suggerisci strategie di pricing per la prossima stagione estiva'"
                defaultValue=""
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <select className="bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none">
                    <option>Tutti i competitor</option>
                    {competitorDemo.map((c) => (
                      <option key={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <select className="bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none">
                    <option>Includi materiali</option>
                    <option>Solo dati base</option>
                  </select>
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Genera analisi
                </button>
              </div>
            </div>

            {/* Example output */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-fuchsia-400" />
                  Ultima analisi generata
                </h3>
                <span className="text-[11px] text-gray-500">
                  30/05/2026, 14:22
                </span>
              </div>
              <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-4">
                  <p className="text-xs font-semibold text-emerald-400 mb-1 uppercase tracking-wider">
                    Vantaggio competitivo
                  </p>
                  <p>
                    Il nostro locale ha un rapporto qualità/prezzo significativamente migliore
                    rispetto a Villa Reale Events e Palazzo Blu, con una capienza
                    superiore a Loft Experience. La flessibilità del layout e la
                    possibilità di eventi sia indoor che outdoor ci differenziano da tutti
                    i competitor analizzati.
                  </p>
                </div>
                <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-4">
                  <p className="text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wider">
                    Strategia consigliata
                  </p>
                  <p>
                    Posizionarsi sul segmento "premium accessibile" per attrarre i clienti
                    che considerano Palazzo Blu troppo costoso ma cercano un'esperienza di
                    livello superiore rispetto a Garden Party Club. Pacchetti tutto incluso
                    con 3 fasce di prezzo.
                  </p>
                </div>
                <div className="rounded-xl bg-blue-500/[0.06] border border-blue-500/20 p-4">
                  <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">
                    Azioni immediate
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Aggiornare il listino con 3 pacchetti (Essential, Premium, Luxury)</li>
                    <li>Creare materiale fotografico professionale degli spazi</li>
                    <li>Proporre partnership con DJ/catering locali per pacchetti all-inclusive</li>
                    <li>Lanciare campagna B2B verso scuole con template "Festa di diploma"</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                <button className="text-xs text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Esporta PDF
                </button>
                <button className="text-xs text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Condividi con team
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Template Co-branding ─── */}
        {tab === "template" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Template Co-branding
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Proposte pronte per scuole, aziende e partner commerciali
                </p>
              </div>
              <button className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-white text-xs font-medium hover:bg-white/[0.10] transition-colors inline-flex items-center gap-2 border border-white/[0.08]">
                <Plus className="w-4 h-4" />
                Nuovo template
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
              {templateDemo.map((t) => (
                <TemplateCard key={t.id} t={t} />
              ))}
            </div>

            {/* Quick pitch */}
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-r from-emerald-500/[0.04] to-blue-500/[0.04] p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Generatore pitch B2B
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Seleziona un template e un target per generare automaticamente
                una proposta commerciale personalizzata.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <select className="bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none">
                  <option>Seleziona template...</option>
                  {templateDemo.map((t) => (
                    <option key={t.id}>{t.nome}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Nome azienda/scuola..."
                  className="bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40"
                />
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Genera proposta
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Modal dettaglio competitor ─── */}
      {selectedCompetitor && (
        <CompetitorDetail
          c={selectedCompetitor}
          onClose={() => setSelectedCompetitor(null)}
        />
      )}
    </div>
  );
}
