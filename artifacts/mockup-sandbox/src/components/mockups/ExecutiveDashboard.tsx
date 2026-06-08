import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Bell,
  Clock,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts";

// Dati fittizi per i grafici
const pipelinePerformance = [
  { mese: "Gen", preventivi: 12000, confermati: 8000, forecast: 10000 },
  { mese: "Feb", preventivi: 19000, confermati: 11000, forecast: 15000 },
  { mese: "Mar", preventivi: 15000, confermati: 12000, forecast: 13000 },
  { mese: "Apr", preventivi: 27000, confermati: 18000, forecast: 22000 },
  { mese: "Mag", preventivi: 32000, confermati: 24000, forecast: 28000 },
  { mese: "Giu", preventivi: 45000, confermati: 31000, forecast: 42000 },
];

const leadConversionStats = [
  { fase: "Lead Generati", count: 180, colore: "#3b82f6" },
  { fase: "Contattati", count: 140, colore: "#8b5cf6" },
  { fase: "Preventivati", count: 95, colore: "#ec4899" },
  { fase: "Trattativa", count: 55, colore: "#f59e0b" },
  { fase: "Confermati", count: 32, colore: "#10b981" },
];

interface ExecutiveAlert {
  id: number;
  tipo: "critico" | "warning" | "info";
  messaggio: string;
  tempo: string;
}

const initialAlerts: ExecutiveAlert[] = [
  { id: 1, tipo: "critico", messaggio: "Rischio perdita lead: Villa Reale ha inviato un preventivo inferiore del 10% a Marco Rossi.", tempo: "10m fa" },
  { id: 2, tipo: "warning", messaggio: "Trattativa bloccata: Il preventivo per la Convention di Pietro Santoro non riceve risposte da 5 giorni.", tempo: "2h fa" },
  { id: 3, tipo: "info", messaggio: "Nuovo lead B2B qualificato: Siemens ha richiesto una proposta per 200 dipendenti.", tempo: "4h fa" },
];

interface Opportunity {
  id: number;
  azienda: string;
  evento: string;
  valore: number;
  probabilita: number;
  stato: "in_valutazione" | "proposta_inviata" | "negoziazione" | "vinto";
  ultimoContatto: string;
}

const opportunitiesDemo: Opportunity[] = [
  { id: 1, azienda: "Stellantis Italia", evento: "Lancio nuovo modello", valore: 25000, probabilita: 75, stato: "negoziazione", ultimoContatto: "Ieri 15:30" },
  { id: 2, azienda: "Deloitte Milano", evento: "Festa di Natale", valore: 18000, probabilita: 50, stato: "proposta_inviata", ultimoContatto: "30 Mag" },
  { id: 3, azienda: "Liceo Scientifico Volta", evento: "Festa dei 100 giorni", valore: 3500, probabilita: 90, stato: "vinto", ultimoContatto: "28 Mag" },
  { id: 4, azienda: "Banca Intesa Sanpaolo", evento: "Workshop Management", valore: 12000, probabilita: 30, stato: "in_valutazione", ultimoContatto: "Ieri 09:00" },
];

const stateLabels: Record<Opportunity["stato"], { label: string; classe: string }> = {
  in_valutazione: { label: "In Valutazione", classe: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  proposta_inviata: { label: "Proposta Inviata", classe: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  negoziazione: { label: "Negoziazione", classe: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  vinto: { label: "Confermato", classe: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};

export default function ExecutiveDashboard() {
  const [alerts, setAlerts] = useState<ExecutiveAlert[]>(initialAlerts);
  const [selectedPeriod, setSelectedPeriod] = useState("Questo Mese");

  const dismissAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[Inter,system-ui,sans-serif] pb-12">
      {/* --- Header --- */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                Executive Canvas
              </span>
              <span className="text-xs text-gray-500">Nessuna API reale</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent mt-1">
              Executive Dashboard & Forecast
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-violet-500/40"
            >
              <option value="Questa Settimana">Questa Settimana</option>
              <option value="Questo Mese">Questo Mese</option>
              <option value="Questo Trimestre">Questo Trimestre</option>
              <option value="Tutto il 2026">Tutto il 2026</option>
            </select>
            <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4" />
              Genera Report AI
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* --- KPI Grid --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue booked */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-emerald-400 bg-emerald-500/10 p-2 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Fatturato Confermato</p>
            <h3 className="text-2xl font-black text-white tracking-tight mt-2">€ 31.000</h3>
            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs mese scorso</span>
            </div>
          </div>

          {/* Forecasted Pipeline */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-violet-400 bg-violet-500/10 p-2 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Pipeline Pesata (Forecast)</p>
            <h3 className="text-2xl font-black text-white tracking-tight mt-2">€ 42.000</h3>
            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Valore preventivi in negoziazione</span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-fuchsia-400 bg-fuchsia-500/10 p-2 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Tasso di Conversione (Win Rate)</p>
            <h3 className="text-2xl font-black text-white tracking-tight mt-2">33.7%</h3>
            <div className="flex items-center gap-1 text-rose-400 text-xs mt-3">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-1.2% rispetto al target 35%</span>
            </div>
          </div>

          {/* Total Opportunities */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-amber-400 bg-amber-500/10 p-2 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Opportunità B2B Attive</p>
            <h3 className="text-2xl font-black text-white tracking-tight mt-2">12 attive</h3>
            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+3 nuove nell'ultima settimana</span>
            </div>
          </div>
        </section>

        {/* --- Alerts Panel --- */}
        {alerts.length > 0 && (
          <section className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-rose-200">Alert e Notifiche di Rischio Commerciale</h2>
            </div>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 bg-black/20 p-3 rounded-xl border border-white/[0.04]">
                  <div className="flex gap-2.5 items-start">
                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${a.tipo === "critico" ? "text-rose-500" : a.tipo === "warning" ? "text-amber-500" : "text-blue-500"}`} />
                    <div>
                      <p className="text-xs text-gray-300 leading-relaxed font-semibold">{a.messaggio}</p>
                      <span className="text-[10px] text-gray-500 inline-flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {a.tempo}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => dismissAlert(a.id)} className="text-gray-500 hover:text-white transition-colors text-xs font-semibold px-2 py-1 bg-white/[0.04] rounded-lg">
                    Gestito
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- Charts Section --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Forecast Area Chart */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Trend Ricavi e Previsioni 2026</h3>
                <p className="text-xs text-gray-500 mt-0.5">Analisi del preventivato confrontato con il confermato ed il forecast pesato</p>
              </div>
              <span className="text-xs text-violet-400 font-semibold bg-violet-500/10 px-2.5 py-1 rounded-full">
                Previsioni AI integrate
              </span>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelinePerformance}>
                  <defs>
                    <linearGradient id="colorConfirm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mese" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val/1000}k`} />
                  <RechartsTooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff" }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Confermato (€)" dataKey="confermati" stroke="#10b981" fillOpacity={1} fill="url(#colorConfirm)" strokeWidth={2} />
                  <Area type="monotone" name="Pipeline Forecast (€)" dataKey="forecast" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Funnel Conversions Bar Chart */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-bold text-white mb-1">Imbuto di Conversione B2B</h3>
            <p className="text-xs text-gray-500 mb-4">Volume contatti per fase del funnel commerciale</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadConversionStats} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <XAxis type="number" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="fase" type="category" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff" }} />
                  <Bar dataKey="count" name="Contatti" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* --- Opportunities Table --- */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Pipeline B2B & Partnership</h3>
              <p className="text-xs text-gray-500 mt-0.5">Trattative di alto valore con scuole, aziende e partner commerciali</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold border border-white/[0.08] transition-all">
              Vedi Tutti
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-4">Azienda / Ente</th>
                  <th className="pb-3 px-4">Tipo Evento</th>
                  <th className="pb-3 px-4 text-right">Valore</th>
                  <th className="pb-3 px-4 text-center">Probabilità</th>
                  <th className="pb-3 px-4">Stato Trattativa</th>
                  <th className="pb-3 px-4">Ultimo Contatto</th>
                  <th className="pb-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {opportunitiesDemo.map((o) => {
                  const state = stateLabels[o.stato];
                  return (
                    <tr key={o.id} className="border-b border-white/[0.04] text-xs hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{o.azienda}</td>
                      <td className="py-3.5 px-4 text-gray-400">{o.evento}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-white">€ {o.valore.toLocaleString("it-IT")}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-semibold text-gray-200">{o.probabilita}%</span>
                          <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${o.probabilita}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${state.classe}`}>
                          {state.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{o.ultimoContatto}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
