import { useState } from "react";
import {
  Calendar,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Clock,
  Settings,
  CheckCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface SyncLogItem {
  id: string;
  titolo: string;
  inizio: string;
  fine: string;
  source: "zak" | "google";
  stato: "synced" | "conflict" | "pending";
}

export default function CalendarSyncMonitor() {
  const [isConnected, setIsConnected] = useState(true);
  const [permissionAlert, setPermissionAlert] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState("zak_main");

  // Sync log data
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([
    {
      id: "1",
      titolo: "Matrimonio Rossi & Bianchi",
      inizio: "12 Set 2026, 16:00",
      fine: "12 Set 2026, 23:30",
      source: "zak",
      stato: "synced",
    },
    {
      id: "2",
      titolo: "Festa di Laurea Marco Neri",
      inizio: "18 Lug 2026, 18:00",
      fine: "18 Lug 2026, 23:00",
      source: "zak",
      stato: "synced",
    },
    {
      id: "3",
      titolo: "Sopralluogo Villa Sposi",
      inizio: "04 Giu 2026, 15:00",
      fine: "04 Giu 2026, 16:30",
      source: "google",
      stato: "synced",
    },
    {
      id: "4",
      titolo: "Pranzo Privato Azienda",
      inizio: "04 Giu 2026, 12:00",
      fine: "04 Giu 2026, 15:30",
      source: "google",
      stato: "conflict",
    },
    {
      id: "5",
      titolo: "Compleanno Bruno",
      inizio: "22 Ago 2026, 20:00",
      fine: "23 Ago 2026, 01:00",
      source: "zak",
      stato: "pending",
    },
  ]);

  const handleRetryAll = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      setSyncLogs((prev) =>
        prev.map((item) => (item.stato === "pending" ? { ...item, stato: "synced" } : item))
      );
    }, 1500);
  };

  const handleResolveConflict = (id: string, resolveTo: "zak" | "google") => {
    setSyncLogs((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            stato: "synced",
            titolo:
              resolveTo === "zak"
                ? `${item.titolo} (Confermato ZAK)`
                : `${item.titolo} (Importato Google)`,
          };
        }
        return item;
      })
    );
  };

  const handleToggleConnection = () => {
    setIsConnected(!isConnected);
    if (!isConnected) {
      setPermissionAlert(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-500" /> Google Calendar Sync Monitor
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Pannello di diagnostica e controllo della sincronizzazione bidirezionale dell'agenda.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPermissionAlert(!permissionAlert)}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Simula Alert Revoca
          </button>
          <button
            onClick={handleRetryAll}
            disabled={isRetrying || !isConnected}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Sincronizzazione..." : "Sincronizza Ora"}
          </button>
        </div>
      </div>

      {/* Revoked Permission Alert */}
      {permissionAlert && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs space-y-2 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Permessi di Accesso Revocati</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Google segnala che l'applicazione ZAK non possiede piu' le autorizzazioni per scrivere sul calendario.
              Questo accade se l'utente ha revocato i permessi dal suo Google Account Dashboard o se il Token e' scaduto.
            </p>
            <button
              onClick={() => {
                setIsConnected(true);
                setPermissionAlert(false);
              }}
              className="bg-amber-500 text-slate-900 font-bold px-3 py-1 rounded text-[10px] hover:bg-amber-600 transition-colors mt-1"
            >
              Riconnetti Account Google
            </button>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns - Status & Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-700 pb-3">
              <Settings className="w-4 h-4 text-indigo-400" /> Stato Connessione API
            </h3>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-slate-900 rounded-xl gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  isConnected
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                }`}>
                  {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <span className="font-bold text-xs block text-slate-100">
                    {isConnected ? "Sincronizzazione Attiva" : "Sincronizzazione Disabilitata"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isConnected ? "google-auth@villazak.com" : "Connessione mancante"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleConnection}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  isConnected
                    ? "border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10"
                    : "border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10"
                }`}
              >
                {isConnected ? "Scollega" : "Collega"}
              </button>
            </div>

            {isConnected && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                    Calendario Selezionato
                  </label>
                  <select
                    value={selectedCalendar}
                    onChange={(e) => setSelectedCalendar(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="zak_main">Calendario Eventi Zak (Consigliato)</option>
                    <option value="zak_sopralluoghi">Sopralluoghi & Visite</option>
                    <option value="private">Calendario Personale Titolare</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                    Watch webhook (Push Notification)
                  </label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 flex justify-between items-center h-9">
                    <span>Scadenza: 11 Giu 2026</span>
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" title="Sottoscrizione attiva" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sync Log list */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm border-b border-slate-700 pb-3">Registro di Sincronizzazione Recente</h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 pr-2">Evento</th>
                    <th className="py-2.5 px-2">Data e Ora</th>
                    <th className="py-2.5 px-2 text-center">Origine</th>
                    <th className="py-2.5 px-2 text-center">Stato</th>
                    <th className="py-2.5 pl-2 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {syncLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/25">
                      <td className="py-3 pr-2 font-semibold text-slate-200">{item.titolo}</td>
                      <td className="py-3 px-2 text-slate-400 text-[11px]">{item.inizio}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                          item.source === "zak"
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        }`}>
                          {item.source}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                          item.stato === "synced"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : item.stato === "conflict"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {item.stato}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        {item.stato === "conflict" && (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleResolveConflict(item.id, "zak")}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors"
                            >
                              Mantieni Zak
                            </button>
                            <button
                              onClick={() => handleResolveConflict(item.id, "google")}
                              className="bg-slate-700 hover:bg-slate-650 text-rose-300 font-bold px-2 py-1 rounded text-[10px] transition-colors"
                            >
                              Mantieni Google
                            </button>
                          </div>
                        )}
                        {item.stato === "pending" && (
                          <button
                            onClick={handleRetryAll}
                            className="text-indigo-400 hover:underline font-semibold"
                          >
                            Invia ora
                          </button>
                        )}
                        {item.stato === "synced" && (
                          <span className="text-slate-500 text-[10px]">Allineato</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          {/* Timeline of events */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm border-b border-slate-700 pb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Attivita' Watchdog
            </h3>
            <div className="space-y-4 relative pl-4 border-l border-slate-700 ml-2 pt-1 text-xs">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-800" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">Oggi, 18:50</span>
                  <span className="font-bold block text-slate-200">Webhook Google Ricevuto</span>
                  <p className="text-slate-400 text-[10px]">
                    Notificata modifica su evento `ext_event_004`. Allineato localmente in 140ms.
                  </p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-800" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">Oggi, 18:32</span>
                  <span className="font-bold block text-slate-200">Sincronizzazione Outbound</span>
                  <p className="text-slate-400 text-[10px]">
                    Esportato preventivo `PRV-2026-0422` su Google Calendar. Stato: Synced.
                  </p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-slate-800" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">Oggi, 18:00</span>
                  <span className="font-bold block text-slate-200">Conflitto Rilevato</span>
                  <p className="text-slate-400 text-[10px]">
                    Rilevata sovrapposizione su data del 4 Giu 12:00 per evento Pranzo Privato Azienda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* quota limits widget */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-300">Quota Richieste Google API</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] text-slate-400">
                <span>Richieste Consumate:</span>
                <span>150 / 10,000</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[1.5%]" />
              </div>
            </div>
            <span className="text-[9px] text-slate-500 block">
              Limite di quota giornaliero azzerato alle 00:00 (Fuso orario Pacifico).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
