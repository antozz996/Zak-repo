import { useState } from "react";
import {
  Calendar,
  Wifi,
  RefreshCw,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SyncedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  source: "zak" | "google";
  status: "synced" | "conflict" | "pending";
}

export default function GoogleCalendarSettingsMock() {
  const { toast } = useToast();

  // Connection state
  const [isConnected, setIsConnected] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState("zak_events");
  
  // Toggles
  const [syncInbound, setSyncInbound] = useState(true);
  const [syncOutbound, setSyncOutbound] = useState(true);
  const [blockOccupied, setBlockOccupied] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);

  // Sync events data
  const [events, setEvents] = useState<SyncedEvent[]>([
    { id: "1", title: "Matrimonio Rossi & Bianchi", date: "2026-09-12", time: "16:00 - 23:30", source: "zak", status: "synced" },
    { id: "2", title: "Team Building Rossi S.p.A.", date: "2026-09-18", time: "09:00 - 18:00", source: "zak", status: "synced" },
    { id: "3", title: "Sopralluogo Villa", date: "2026-06-04", time: "15:00 - 16:30", source: "google", status: "synced" },
    { id: "4", title: "Pranzo Privato Azienda", date: "2026-06-04", time: "12:00 - 15:30", source: "google", status: "conflict" },
  ]);

  const handleToggleConnection = () => {
    setIsConnected(!isConnected);
    toast({
      title: !isConnected ? "Google Calendar Connesso" : "Google Calendar Disconnesso",
      description: !isConnected ? "Account google@venue-zak.com collegato." : "Collegamento OAuth rimosso.",
    });
  };

  const handleResolveConflict = (eventId: string, strategy: "keep_zak" | "keep_google") => {
    toast({
      title: "Conflitto Risolto",
      description: strategy === "keep_zak" ? "Priorita' assegnata a ZAK. Evento Google aggiornato." : "Forzato evento Google. Agenda ZAK aggiornata.",
    });
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "synced" } : e))
    );
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 border-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="w-8 h-8 text-indigo-500" /> Google Calendar Settings (Mockup)
            </h1>
            <p className="text-muted-foreground mt-1">
              Configura la sincronizzazione bidirezionale degli eventi in agenda con Google Calendar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Settings / Connection Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* OAuth Connection */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold">1. Connessione Google Account (OAuth 2.0)</CardTitle>
                <CardDescription className="text-[10px]">Collega l'account della venue per sincronizzare le date.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-4">
                <div className="flex items-center justify-between p-3.5 border rounded-xl bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-900 border rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-foreground">
                        {isConnected ? "Account Connesso" : "Account non collegato"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {isConnected ? "google@venue-zak.com" : "Connetti Google per iniziare"}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleToggleConnection}
                    variant={isConnected ? "outline" : "default"}
                    className={`h-8 text-xs font-bold ${!isConnected ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}`}
                  >
                    {isConnected ? "Disconnetti" : "Connetti Account"}
                  </Button>
                </div>

                {isConnected && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider block">Calendario Principale</label>
                      <select
                        value={selectedCalendar}
                        onChange={(e) => setSelectedCalendar(e.target.value)}
                        className="w-full bg-background border border-border text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                      >
                        <option value="zak_events">Calendario Eventi Zak (Consigliato)</option>
                        <option value="personal">Calendario Personale</option>
                        <option value="wedding">Wedding Planning Schedule</option>
                      </select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sync Toggles */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold">2. Regole e Opzioni di Sincronizzazione</CardTitle>
                <CardDescription className="text-[10px]">Seleziona il comportamento del connettore bidirezionale.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-4">
                
                {/* Toggle Inbound */}
                <div className="flex items-center justify-between p-2">
                  <div className="space-y-0.5">
                    <span className="font-bold block text-foreground">Sincronizzazione Inbound (Google &rarr; ZAK)</span>
                    <span className="text-[10px] text-muted-foreground block">Sincronizza le note e le date esterne importandole su ZAK.</span>
                  </div>
                  <button onClick={() => setSyncInbound(!syncInbound)} disabled={!isConnected} className="text-indigo-600 disabled:opacity-50">
                    {syncInbound ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-muted-foreground" />}
                  </button>
                </div>

                {/* Toggle Outbound */}
                <div className="flex items-center justify-between p-2 border-t pt-4">
                  <div className="space-y-0.5">
                    <span className="font-bold block text-foreground">Sincronizzazione Outbound (ZAK &rarr; Google)</span>
                    <span className="text-[10px] text-muted-foreground block">Esporta le date e i sopralluoghi ZAK su Google Calendar.</span>
                  </div>
                  <button onClick={() => setSyncOutbound(!syncOutbound)} disabled={!isConnected} className="text-indigo-600 disabled:opacity-50">
                    {syncOutbound ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-muted-foreground" />}
                  </button>
                </div>

                {/* Toggle Block Date */}
                <div className="flex items-center justify-between p-2 border-t pt-4">
                  <div className="space-y-0.5">
                    <span className="font-bold block text-foreground">Blocca Date Occupate da Google</span>
                    <span className="text-[10px] text-muted-foreground block">Impedisce la preventivazione in ZAK durante le ferie o manutenzioni Google.</span>
                  </div>
                  <button onClick={() => setBlockOccupied(!blockOccupied)} disabled={!isConnected} className="text-indigo-600 disabled:opacity-50">
                    {blockOccupied ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-muted-foreground" />}
                  </button>
                </div>

                {/* Toggle Auto Retry */}
                <div className="flex items-center justify-between p-2 border-t pt-4">
                  <div className="space-y-0.5">
                    <span className="font-bold block text-foreground">Tentativi Retry Automatici</span>
                    <span className="text-[10px] text-muted-foreground block">Riprova automaticamente in caso di errori di quota o timeout API Google.</span>
                  </div>
                  <button onClick={() => setAutoRetry(!autoRetry)} disabled={!isConnected} className="text-indigo-600 disabled:opacity-50">
                    {autoRetry ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-muted-foreground" />}
                  </button>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Sync History & Conflict Resolution */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Sync History List */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold">3. Log Eventi Sincronizzati</CardTitle>
                <CardDescription className="text-[10px]">Ultimi aggiornamenti del connettore</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-3">
                {events.map((e) => (
                  <div key={e.id} className="p-3 border rounded-xl bg-card space-y-2 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      e.status === "conflict" ? "bg-rose-500" : "bg-emerald-500"
                    }`} />
                    <div className="flex justify-between items-start pl-1">
                      <div>
                        <h4 className="font-bold text-foreground truncate w-40" title={e.title}>{e.title}</h4>
                        <span className="text-[9px] text-muted-foreground block">{e.date} · {e.time}</span>
                      </div>
                      <Badge className={`text-[8px] px-1.5 py-0.5 font-bold uppercase ${
                        e.status === "conflict" ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      }`}>
                        {e.status === "conflict" ? "Conflitto" : "Sincronizzato"}
                      </Badge>
                    </div>

                    {/* Show conflict resolution panel if status is conflict */}
                    {e.status === "conflict" && (
                      <div className="mt-2.5 p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg space-y-2 text-[10px]">
                        <span className="font-bold text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sovrapposizione Orari Rilevata
                        </span>
                        <p className="text-muted-foreground leading-relaxed">
                          L'evento Google Calendar si sovrappone a una data opzionata su ZAK. Risolvi il conflitto:
                        </p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleResolveConflict(e.id, "keep_zak")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-6 text-[9px] flex-1"
                          >
                            Mantieni ZAK
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveConflict(e.id, "keep_google")}
                            className="h-6 text-[9px] flex-1 text-rose-600 border-rose-500/20 hover:bg-rose-500/5 font-bold"
                          >
                            Forza Google
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* API limits status */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" /> Quota Limiti API Google
                </CardTitle>
                <CardDescription className="text-[10px]">Stato delle richieste rimanenti</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Richieste Giornaliere:</span>
                  <span className="font-bold text-foreground">9,850 / 10,000 (Rimanenti)</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[98.5%]" />
                </div>
                <span className="text-[9px] text-muted-foreground block mt-1">
                  Rinnovo automatico watch webhook attivo (Scadenza: 09/06/2026).
                </span>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
