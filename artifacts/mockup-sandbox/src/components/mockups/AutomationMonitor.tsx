import { useState } from "react";
import {
  Play,
  Pause,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  Cpu,
  Power,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts";

interface Workflow {
  id: number;
  nome: string;
  descrizione: string;
  stato: "attivo" | "pausa";
  esecuzioniTotali: number;
  successRate: number;
  tipo: "whatsapp" | "system" | "voice";
}

const initialWorkflows: Workflow[] = [
  { id: 1, nome: "WhatsApp Re-engagement 5gg", descrizione: "Invia follow-up automatico ai lead che non rispondono da 5 giorni.", stato: "attivo", esecuzioniTotali: 342, successRate: 97.8, tipo: "whatsapp" },
  { id: 2, nome: "Auguri Compleanno Cliente", descrizione: "Invia auguri WhatsApp 15 giorni prima della data con codice promo.", stato: "attivo", esecuzioniTotali: 154, successRate: 99.1, tipo: "whatsapp" },
  { id: 3, nome: "Follow-up Preventivo Scaduto", descrizione: "Verifica scadenze preventivi e notifica lo staff via task.", stato: "attivo", esecuzioniTotali: 88, successRate: 100, tipo: "system" },
  { id: 4, nome: "Integrazione Voice Call webhook", descrizione: "Elabora i payload in ingresso da Vapi/Bland e crea schede lead.", stato: "attivo", esecuzioniTotali: 412, successRate: 96.2, tipo: "voice" },
];

interface ExecutionLog {
  id: number;
  timestamp: string;
  workflow: string;
  contatto: string;
  stato: "successo" | "fallito" | "ignorato";
  dettaglio: string;
}

const logsDemo: ExecutionLog[] = [
  { id: 1, timestamp: "12:15:30", workflow: "WhatsApp Re-engagement 5gg", contatto: "Marco Rossi", stato: "successo", dettaglio: "Template 're_engage_v1' inviato con successo." },
  { id: 2, timestamp: "12:00:15", workflow: "Integrazione Voice Call webhook", contatto: "Davide Moretti", stato: "successo", dettaglio: "Chiamata elaborata: creato lead e task associato." },
  { id: 3, timestamp: "11:42:00", workflow: "WhatsApp Re-engagement 5gg", contatto: "Giulia Bianchi", stato: "ignorato", dettaglio: "Ignorato: cliente ha risposto meno di 24 ore fa." },
  { id: 4, timestamp: "10:30:12", workflow: "Auguri Compleanno Cliente", contatto: "Francesco Di Maio", stato: "fallito", dettaglio: "ERROR: Phone number is not registered on WhatsApp." },
  { id: 5, timestamp: "09:15:45", workflow: "Follow-up Preventivo Scaduto", contatto: "Pietro Santoro", stato: "successo", dettaglio: "Preventivo verificato: task scadenza creato per staff." },
  { id: 6, timestamp: "08:00:00", workflow: "WhatsApp Re-engagement 5gg", contatto: "Giuseppe Martini", stato: "fallito", dettaglio: "ERROR: Outside 24h window - Template required." },
];

// Success rate trend data over hours
const executionPerformance = [
  { ora: "08:00", successi: 45, fallimenti: 2, ignorati: 5 },
  { ora: "09:00", successi: 55, fallimenti: 1, ignorati: 8 },
  { ora: "10:00", successi: 72, fallimenti: 4, ignorati: 12 },
  { ora: "11:00", successi: 64, fallimenti: 0, ignorati: 6 },
  { ora: "12:00", successi: 80, fallimenti: 3, ignorati: 10 },
];

export default function AutomationMonitor() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [logs, setLogs] = useState<ExecutionLog[]>(logsDemo);
  const [filterStato, setFilterStato] = useState<string>("tutti");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleWorkflow = (id: number) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, stato: w.stato === "attivo" ? "pausa" : "attivo" } : w));
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = `${log.workflow} ${log.contatto} ${log.dettaglio}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStato === "tutti" || log.stato === filterStato;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (stato: ExecutionLog["stato"]) => {
    switch (stato) {
      case "successo":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Successo</span>;
      case "fallito":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><XCircle className="w-3 h-3" /> Fallito</span>;
      case "ignorato":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20"><AlertTriangle className="w-3 h-3" /> Ignorato</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[Inter,system-ui,sans-serif] pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-violet-400" />
              <span className="text-xs text-gray-500">Monitor Esecuzioni CRM & AI</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mt-1">
              Automation & Engine Monitor
            </h1>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-white text-xs font-semibold hover:bg-white/[0.08] transition-colors inline-flex items-center gap-2 border border-white/[0.08]">
            <RefreshCw className="w-3.5 h-3.5" />
            Aggiorna Log
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Top metrics grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-xs text-gray-400 font-semibold">Tasso Successo Globale</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-2">98.2%</h3>
            <p className="text-[10px] text-gray-500 mt-1">Media calcolata su 996 esecuzioni nelle ultime 24h</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-xs text-gray-400 font-semibold">Esecuzioni Fallite</p>
            <h3 className="text-3xl font-black text-rose-500 mt-2">8 fallimenti</h3>
            <p className="text-[10px] text-gray-500 mt-1">Richiede intervento manuale (es. numeri errati)</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-xs text-gray-400 font-semibold">Trigger Attivi</p>
            <h3 className="text-3xl font-black text-white mt-2">4/4 attivi</h3>
            <p className="text-[10px] text-gray-500 mt-1">Tutte le code operative del CRM sono in funzione</p>
          </div>
        </section>

        {/* Chart section */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div>
            <h3 className="text-sm font-bold text-white">Rapporto Giornaliero Esecuzioni</h3>
            <p className="text-xs text-gray-500 mt-0.5">Andamento orario delle risposte automatiche inviate</p>
          </div>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={executionPerformance}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="ora" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" name="Successo" dataKey="successi" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Workflow Configuration list */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Motori e Regole di Automazione</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((w) => (
              <div key={w.id} className="rounded-xl border border-white/[0.04] bg-black/20 p-4 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${w.stato === "attivo" ? "bg-emerald-500 animate-pulse" : "bg-gray-500"}`} />
                      {w.nome}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{w.descrizione}</p>
                  </div>

                  {/* Play/Pause switch */}
                  <button
                    onClick={() => toggleWorkflow(w.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      w.stato === "attivo"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-gray-500/10 border-gray-500/20 text-gray-400 hover:bg-gray-500/20"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-[10px] font-semibold text-gray-500">
                  <span>Esecuzioni: {w.esecuzioniTotali}</span>
                  <span className="text-emerald-400">Success Rate: {w.successRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Logs Table */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Log delle Esecuzioni Recenti</h3>
              <p className="text-xs text-gray-500 mt-0.5">Dettaglio esecuzioni webhook e messaggi automatici</p>
            </div>
            
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Cerca log..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl focus:outline-none focus:border-violet-500/40 w-44"
                />
              </div>
              <div className="flex gap-1 border border-white/[0.08] bg-black/30 rounded-xl p-0.5 select-none">
                {["tutti", "successo", "fallito", "ignorato"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStato(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                      filterStato === st
                        ? "bg-violet-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">Ora</th>
                  <th className="pb-3 px-3">Workflow</th>
                  <th className="pb-3 px-3">Contatto</th>
                  <th className="pb-3 px-3">Stato</th>
                  <th className="pb-3 px-3">Dettagli / Errore</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.04] text-xs hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {log.timestamp}
                    </td>
                    <td className="py-3 px-3 text-gray-200 font-semibold">{log.workflow}</td>
                    <td className="py-3 px-3 text-violet-300 font-medium">{log.contatto}</td>
                    <td className="py-3 px-3">{getStatusBadge(log.stato)}</td>
                    <td className="py-3 px-3 text-gray-400 max-w-sm truncate">{log.dettaglio}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-xs text-gray-500">
                      Nessun log corrisponde ai criteri di ricerca
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
