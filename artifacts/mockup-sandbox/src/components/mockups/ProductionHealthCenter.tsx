import { useState } from "react";
import {
  Activity,
  Database,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Terminal,
  Clock,
  ShieldAlert,
  Server,
} from "lucide-react";

interface ServiceStatus {
  name: string;
  type: "api" | "db" | "webhook" | "integration";
  status: "healthy" | "degraded" | "down";
  details: string;
  latency: string;
}

interface ErrorLog {
  timestamp: string;
  level: "error" | "warn";
  service: string;
  message: string;
}

export default function ProductionHealthCenter() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "API Server Backend", type: "api", status: "healthy", details: "Node.js Express 5.0 active", latency: "25ms" },
    { name: "PostgreSQL Database", type: "db", status: "healthy", details: "Connected via Drizzle pool (12 active conn)", latency: "8ms" },
    { name: "Meta WhatsApp Webhook", type: "webhook", status: "healthy", details: "Firma SHA256 verificata", latency: "110ms" },
    { name: "Google Calendar Provider", type: "integration", status: "healthy", details: "Sync bidirezionale OAuth attivo", latency: "220ms" },
    { name: "Vapi Voice Integration", type: "integration", status: "degraded", details: "Timeout parziale su porta 5060", latency: "450ms" },
    { name: "Bland.ai Webhook", type: "webhook", status: "healthy", details: "Webhook post-chiamata registrato", latency: "190ms" },
  ]);

  const [logs, setLogs] = useState<ErrorLog[]>([
    { timestamp: "15:42:01", level: "warn", service: "google-sync", message: "Google API rate limit close to quota warning (95% remaining)." },
    { timestamp: "15:30:15", level: "error", service: "vapi-webhook", message: "Webhook payload verification failed: Invalid provider signature." },
    { timestamp: "14:15:30", level: "warn", service: "whatsapp-bot", message: "Client session #4102 paused due to low sentiment score detection." },
    { timestamp: "12:00:05", level: "error", service: "db-pool", message: "Temporary connection timeout to PostgreSQL. Retried and resolved." },
  ]);

  // Pre-deploy checklist state
  const [checklist, setChecklist] = useState([
    { id: 1, label: "Segreti d'ambiente caricati nel Cloud Vault", checked: true },
    { id: 2, label: "Eseguite migrazioni schema db (drizzle-kit push/migrate)", checked: true },
    { id: 3, label: "Verifica firma webhook Meta e Google OAuth redirect URI", checked: false },
    { id: 4, label: "Build di produzione del frontend zak-app completata", checked: true },
    { id: 5, label: "Verifica rate limit abilitati su rotte sensibili", checked: false },
  ]);

  const toggleChecklistItem = (id: number) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSimulateFix = () => {
    setServices((prev) =>
      prev.map((s) => (s.name.includes("Vapi") ? { ...s, status: "healthy", details: "Timeout risolto, funzionamento regolare" } : s))
    );
    alert("Servizio ripristinato! Tutti i nodi sono in salute.");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-500" /> Production Health Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Console di monitoraggio sistemistico per ZAK Ecosystem AI. Stato dell'infrastruttura in tempo reale.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateFix}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            Ripristina Servizi Degradati
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Uptime Globale</span>
          <div className="text-xl font-bold text-emerald-400">99.98%</div>
          <span className="text-[9px] text-slate-500 block">Monitoraggio degli ultimi 30 giorni</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tempo Risposta Medio API</span>
          <div className="text-xl font-bold text-slate-100">45ms</div>
          <span className="text-[9px] text-slate-500 block">Calcolato su 124,000 richieste</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Error Rate (24h)</span>
          <div className="text-xl font-bold text-indigo-400">0.02%</div>
          <span className="text-[9px] text-slate-500 block">Allineato con la soglia di tolleranza SLA</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Node Status (2/3 size) */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm border-b border-slate-700 pb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" /> Stato Nodi e Servizi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((svc, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start justify-between gap-3 relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  svc.status === "healthy"
                    ? "bg-emerald-500"
                    : svc.status === "degraded"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`} />
                <div className="space-y-1 pl-1 text-xs">
                  <span className="font-bold block text-slate-200">{svc.name}</span>
                  <span className="text-[10px] text-slate-400 block">{svc.details}</span>
                  <span className="text-[9px] text-slate-500 block">Latenza: {svc.latency}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold ${
                  svc.status === "healthy"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : svc.status === "degraded"
                    ? "bg-amber-500/10 text-amber-400 animate-pulse"
                    : "bg-rose-500/10 text-rose-400 animate-bounce"
                }`}>
                  {svc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Pre-deploy Checklist (1/3 size) */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-sm border-b border-slate-700 pb-3 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-400" /> Checklist Go-Live
          </h3>
          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-2.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  item.checked
                    ? "bg-indigo-500/5 border-indigo-500/30 text-slate-200"
                    : "bg-slate-900 border-slate-800 hover:bg-slate-900/55 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    readOnly
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 pointer-events-none"
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section: Log Console */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm border-b border-slate-700 pb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" /> Console Log di Errore Recenti
        </h3>
        <div className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] space-y-2 border border-slate-800 max-h-48 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
              <span className={`font-bold shrink-0 uppercase text-[9px] px-1 py-0.25 rounded ${
                log.level === "error" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {log.level}
              </span>
              <span className="text-indigo-400 shrink-0">&lt;{log.service}&gt;:</span>
              <span className="text-slate-300 leading-normal">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
