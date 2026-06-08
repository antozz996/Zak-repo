import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Search, Filter, Info, ShieldCheck, Download, Calendar } from "lucide-react";

interface SecurityEvent {
  id: string;
  timestamp: string;
  utente: string;
  ruolo: "admin" | "manager" | "staff" | "sconosciuto";
  evento: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "ROLE_CHANGE" | "ACCESS_DENIED" | "DATA_EXPORT" | "USER_STATUS_CHANGE";
  dettagli: string;
  ip: string;
  esito: "successo" | "fallito" | "bloccato";
}

const mockSecurityEvents: SecurityEvent[] = [
  { id: "SEC-001", timestamp: "02/06/2026 18:15:22", utente: "alessandro.rossi@villazak.com", ruolo: "admin", evento: "LOGIN_SUCCESS", dettagli: "Login completato con successo", ip: "192.168.1.45", esito: "successo" },
  { id: "SEC-002", timestamp: "02/06/2026 18:12:05", utente: "ignoto@host.com", ruolo: "sconosciuto", evento: "LOGIN_FAILED", dettagli: "Tentativo fallito (password errata 3 volte)", ip: "89.24.112.5", esito: "fallito" },
  { id: "SEC-003", timestamp: "02/06/2026 17:55:10", utente: "alessandro.rossi@villazak.com", ruolo: "admin", evento: "ROLE_CHANGE", dettagli: "Cambiato ruolo utente 'Chiara Ferrari' a 'manager'", ip: "192.168.1.45", esito: "successo" },
  { id: "SEC-004", timestamp: "02/06/2026 17:42:15", utente: "roberto.martini@villazak.com", ruolo: "staff", evento: "ACCESS_DENIED", dettagli: "Tentato accesso a /audit-log senza permessi", ip: "192.168.1.50", esito: "bloccato" },
  { id: "SEC-005", timestamp: "02/06/2026 16:30:00", utente: "giuseppe.esposito@villazak.com", ruolo: "manager", evento: "DATA_EXPORT", dettagli: "Esportati 120 contatti CRM in CSV", ip: "192.168.1.48", esito: "successo" },
  { id: "SEC-006", timestamp: "02/06/2026 15:22:45", utente: "alessandro.rossi@villazak.com", ruolo: "admin", evento: "USER_STATUS_CHANGE", dettagli: "Disattivato utente 'Valeria Conte' (account bloccato)", ip: "192.168.1.45", esito: "successo" },
  { id: "SEC-007", timestamp: "01/06/2026 19:40:12", utente: "chiara.ferrari@villazak.com", ruolo: "staff", evento: "LOGIN_SUCCESS", dettagli: "Login completato con successo", ip: "192.168.1.52", esito: "successo" },
  { id: "SEC-008", timestamp: "01/06/2026 19:38:05", utente: "chiara.ferrari@villazak.com", ruolo: "staff", evento: "LOGIN_FAILED", dettagli: "Tentativo fallito (password non corretta)", ip: "192.168.1.52", esito: "fallito" },
  { id: "SEC-009", timestamp: "01/06/2026 14:15:30", utente: "giuseppe.esposito@villazak.com", ruolo: "manager", evento: "ACCESS_DENIED", dettagli: "Tentato accesso a /settings/meta senza permessi", ip: "192.168.1.48", esito: "bloccato" },
  { id: "SEC-010", timestamp: "31/05/2026 11:20:00", utente: "alessandro.rossi@villazak.com", ruolo: "admin", evento: "DATA_EXPORT", dettagli: "Esportato report finanziario maggio", ip: "192.168.1.45", esito: "successo" }
];

const ruoloColore: Record<string, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-amber-100 text-amber-800 border-amber-200",
  staff: "bg-blue-100 text-blue-800 border-blue-200",
  sconosciuto: "bg-gray-100 text-gray-800 border-gray-200"
};

const eventoEtichetta: Record<string, string> = {
  LOGIN_SUCCESS: "Accesso Riuscito",
  LOGIN_FAILED: "Tentativo Accesso Fallito",
  ROLE_CHANGE: "Cambio Ruolo",
  ACCESS_DENIED: "Accesso Negato",
  DATA_EXPORT: "Esportazione Dati",
  USER_STATUS_CHANGE: "Modifica Stato Account"
};

const eventoColore: Record<string, string> = {
  LOGIN_SUCCESS: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  LOGIN_FAILED: "bg-red-500/10 text-red-600 border-red-500/20",
  ROLE_CHANGE: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ACCESS_DENIED: "bg-destructive/10 text-destructive border-destructive/20",
  DATA_EXPORT: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  USER_STATUS_CHANGE: "bg-amber-500/10 text-amber-600 border-amber-500/20"
};

const esitoBadge: Record<string, string> = {
  successo: "bg-emerald-500 text-white hover:bg-emerald-600",
  fallito: "bg-red-500 text-white hover:bg-red-600",
  bloccato: "bg-destructive text-white hover:bg-destructive"
};

export default function SecurityAuditMock() {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = mockSecurityEvents.filter((ev) => {
    const matchesFilter = filterType === "ALL" || ev.evento === filterType;
    const matchesSearch =
      ev.utente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.dettagli.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.ip.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                Security Audit Log
              </h1>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/5">
                Demo
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Registro immutabile degli eventi di sicurezza di sistema. Questa sezione e' una simulazione frontend con dati locali fittizi.
            </p>
          </div>
        </div>

        {/* Demo Warning Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span><strong>Stato Demo:</strong> Questa pagina usa dati demo locali. Non raccoglie eventi reali dal backend.</span>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              Filtri di Ricerca
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            
            {/* Search Input */}
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="search">Cerca per utente, IP o dettagli</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="search"
                  type="text"
                  placeholder="es. alessandro.rossi, 192.168.1.45..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-60 space-y-1.5">
              <Label htmlFor="filter-type">Tipo Evento</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti gli eventi</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Accessi Riusciti</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Tentativi Falliti</SelectItem>
                  <SelectItem value="ROLE_CHANGE">Cambi Ruolo</SelectItem>
                  <SelectItem value="ACCESS_DENIED">Accessi Negati</SelectItem>
                  <SelectItem value="DATA_EXPORT">Esportazioni Dati</SelectItem>
                  <SelectItem value="USER_STATUS_CHANGE">Stati Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* Events Table Card */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Data & Ora</TableHead>
                  <TableHead>Operatore / Indirizzo IP</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Dettagli</TableHead>
                  <TableHead className="pr-6 text-right">Esito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nessun evento corrispondente ai filtri impostati.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="pl-6 font-semibold text-xs text-muted-foreground flex items-center gap-1.5 py-4">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {ev.timestamp}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-foreground">{ev.utente}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{ev.ip}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] border ${ruoloColore[ev.ruolo]}`}>
                          {ev.ruolo.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-bold border uppercase tracking-wider ${eventoColore[ev.evento]}`}>
                          {eventoEtichetta[ev.evento]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{ev.dettagli}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge className={`text-[9px] uppercase font-bold ${esitoBadge[ev.esito]}`}>
                          {ev.esito}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </SidebarLayout>
  );
}
