import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck,
  User,
  Users,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  UserCheck,
  UserMinus,
  Lock,
  KeyRound,
  ShieldAlert
} from "lucide-react";

interface UserAccount {
  id: number;
  nome: string;
  email: string;
  ruolo: "admin" | "manager" | "staff";
  stato: "attivo" | "disattivato";
  ultimoAccesso: string;
}

const initialUsers: UserAccount[] = [
  { id: 1, nome: "Alessandro Rossi", email: "alessandro.rossi@villazak.com", ruolo: "admin", stato: "attivo", ultimoAccesso: "Oggi 14:15" },
  { id: 2, nome: "Giuseppe Esposito", email: "giuseppe.esposito@villazak.com", ruolo: "manager", stato: "attivo", ultimoAccesso: "Oggi 11:30" },
  { id: 3, nome: "Chiara Ferrari", email: "chiara.ferrari@villazak.com", ruolo: "staff", stato: "attivo", ultimoAccesso: "Ieri 18:22" },
  { id: 4, nome: "Roberto Martini", email: "roberto.martini@villazak.com", ruolo: "staff", stato: "attivo", ultimoAccesso: "30 Mag" },
  { id: 5, nome: "Valeria Conte", email: "valeria.conte@villazak.com", ruolo: "staff", stato: "disattivato", ultimoAccesso: "25 Mag" },
];

interface Permesso {
  chiave: string;
  descrizione: string;
  categoria: "Visualizzazione" | "Operativita'" | "Configurazione";
  admin: boolean;
  manager: boolean;
  staff: boolean;
}

const initialPermissions: Permesso[] = [
  { chiave: "dashboard.view", descrizione: "Visualizzazione Dashboard Executive", categoria: "Visualizzazione", admin: true, manager: true, staff: false },
  { chiave: "inbox.read", descrizione: "Lettura Messaggi Inbox", categoria: "Operativita'", admin: true, manager: true, staff: true },
  { chiave: "inbox.write", descrizione: "Risposta Manuale & Assegnazione Chat", categoria: "Operativita'", admin: true, manager: true, staff: true },
  { chiave: "contatti.manage", descrizione: "Gestione Contatti & Timeline CRM", categoria: "Operativita'", admin: true, manager: true, staff: true },
  { chiave: "preventivi.manage", descrizione: "Creazione & Modifica Preventivi", categoria: "Operativita'", admin: true, manager: true, staff: false },
  { chiave: "agenda.manage", descrizione: "Gestione Calendario & Impegni", categoria: "Operativita'", admin: true, manager: true, staff: true },
  { chiave: "task.manage", descrizione: "Gestione Task e Promemoria Personali", categoria: "Operativita'", admin: true, manager: true, staff: true },
  { chiave: "automazioni.manage", descrizione: "Configurazione & Avvio Automazioni CRM", categoria: "Configurazione", admin: true, manager: true, staff: false },
  { chiave: "audit.view", descrizione: "Visualizzazione Audit Log", categoria: "Visualizzazione", admin: true, manager: false, staff: false },
  { chiave: "settings.manage", descrizione: "Modifica Impostazioni e Webhook di Sistema", categoria: "Configurazione", admin: true, manager: false, staff: false },
];

const ruoloColore: Record<string, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-amber-100 text-amber-800 border-amber-200",
  staff: "bg-blue-100 text-blue-800 border-blue-200",
};

const ruoloEtichetta: Record<string, string> = {
  admin: "Amministratore",
  manager: "Venue Manager",
  staff: "Operatore Staff",
};

const RuoloIcona = ({ ruolo }: { ruolo: string }) => {
  if (ruolo === "admin") return <ShieldCheck className="w-3.5 h-3.5 mr-1" />;
  if (ruolo === "manager") return <Users className="w-3.5 h-3.5 mr-1" />;
  return <User className="w-3.5 h-3.5 mr-1" />;
};

export default function AdminRoles() {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [permissions, setPermissions] = useState<Permesso[]>(initialPermissions);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>(["Inizializzazione della sessione demo di sicurezza."]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("it-IT");
    setSimulatedLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const toggleUserStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nuovoStato = u.stato === "attivo" ? "disattivato" : "attivo";
          addLog(`Stato utente '${u.nome}' modificato in: ${nuovoStato.toUpperCase()}.`);
          setHasUnsavedChanges(true);
          return { ...u, stato: nuovoStato };
        }
        return u;
      })
    );
  };

  const changeUserRole = (id: number, nuovoRuolo: "admin" | "manager" | "staff") => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          addLog(`Ruolo utente '${u.nome}' cambiato da ${u.ruolo.toUpperCase()} a ${nuovoRuolo.toUpperCase()}.`);
          setHasUnsavedChanges(true);
          return { ...u, ruolo: nuovoRuolo };
        }
        return u;
      })
    );
  };

  const togglePermission = (permKey: string, ruolo: "admin" | "manager" | "staff") => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.chiave === permKey) {
          const nuovoValore = !p[ruolo];
          addLog(`Permesso '${permKey}' per il ruolo '${ruolo.toUpperCase()}' impostato a: ${nuovoValore ? "ATTIVO" : "DISATTIVATO"}.`);
          setHasUnsavedChanges(true);
          return { ...p, [ruolo]: nuovoValore };
        }
        return p;
      })
    );
  };

  const filteredUsers = users.filter((u) =>
    u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <KeyRound className="w-8 h-8 text-primary" />
                Ruoli & Permessi
              </h1>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/5">
                Demo
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Definisci le autorizzazioni di accesso per ciascun ruolo dello staff. Questa pagina e' una simulazione frontend con dati locali fittizi.
            </p>
          </div>
        </div>

        {/* Demo Warning Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span><strong>Stato Demo:</strong> Questa pagina usa dati demo locali. Non effettua chiamate API ne' modifica utenti o permessi reali nel database.</span>
        </div>

        {/* Security / RBAC info Card */}
        <Card className="border-destructive/20 bg-destructive/5 text-destructive-foreground">
          <CardHeader className="py-4 flex flex-row items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            <div>
              <CardTitle className="text-sm font-bold">Nota sulla Sicurezza</CardTitle>
              <CardDescription className="text-xs text-destructive-foreground/80 mt-0.5">
                Questa pagina non implementa autenticazione reale. Serve solo come prototipo UI per la futura gestione RBAC.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Users List and Details (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Users List Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Utenti Registrati nella Venue</CardTitle>
                    <CardDescription>Visualizza e seleziona un utente dello staff per modificarne lo stato e il ruolo.</CardDescription>
                  </div>
                  
                  {/* Search filter */}
                  <div className="relative w-44 shrink-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cerca utente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Utente</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                          <UserMinus className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm font-medium">Nessun utente corrisponde alla ricerca</p>
                          <p className="text-xs text-muted-foreground/70">Prova a modificare i termini cercati.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedUserId === u.id ? "bg-muted" : ""
                          }`}
                        >
                          <TableCell className="font-medium pl-6">
                            <div>{u.nome}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-semibold flex items-center w-fit ${ruoloColore[u.ruolo]}`}>
                              <RuoloIcona ruolo={u.ruolo} />
                              {ruoloEtichetta[u.ruolo]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.stato === "attivo" ? "default" : "secondary"} className={u.stato === "attivo" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}>
                              {u.stato === "attivo" ? "Attivo" : "Disattivato"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Selected User Detail Card */}
            {selectedUser ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Gestione Operatore</CardTitle>
                    <CardDescription>Modifica i dati locali per l'operatore selezionato.</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUserId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Deseleziona
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nome completo</Label>
                      <div className="text-sm font-semibold">{selectedUser.nome}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="text-sm font-semibold">{selectedUser.email}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ultimo accesso</Label>
                      <div className="text-sm text-muted-foreground">{selectedUser.ultimoAccesso}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stato Corrente</Label>
                      <div className="text-sm mt-0.5">
                        <Badge variant={selectedUser.stato === "attivo" ? "outline" : "secondary"} className={selectedUser.stato === "attivo" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 font-bold" : ""}>
                          {selectedUser.stato === "attivo" ? "ATTIVO" : "DISATTIVATO"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="ruolo-select">Cambia Ruolo</Label>
                      <Select
                        value={selectedUser.ruolo}
                        onValueChange={(val: "admin" | "manager" | "staff") => changeUserRole(selectedUser.id, val)}
                      >
                        <SelectTrigger id="ruolo-select">
                          <SelectValue placeholder="Seleziona ruolo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Amministratore (Admin)</SelectItem>
                          <SelectItem value="manager">Venue Manager</SelectItem>
                          <SelectItem value="staff">Staff (Operatore)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-muted-foreground">Stato dell'account</span>
                      <Button
                        variant={selectedUser.stato === "attivo" ? "destructive" : "default"}
                        className={selectedUser.stato === "disattivato" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        onClick={() => toggleUserStatus(selectedUser.id)}
                      >
                        {selectedUser.stato === "attivo" ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" /> Disattiva Account
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" /> Riattiva Account
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gestione Operatore</CardTitle>
                  <CardDescription>Nessun utente selezionato.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <User className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm">Seleziona un utente dalla lista soprastante per gestirne il ruolo e lo stato della sessione.</p>
                </CardContent>
              </Card>
            )}

            {/* Simulated actions log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Log Operazioni Simulate (Tempo Reale)</CardTitle>
                <CardDescription className="text-xs">Registro locale delle modifiche effettuate durante questa sessione.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black/80 font-mono text-xs p-3 rounded-lg text-emerald-400 h-32 overflow-y-auto space-y-1">
                  {simulatedLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Permissions Matrix (6 Cols) */}
          <div className="lg:col-span-6">
            
            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Matrice dei Permessi per Ruolo</CardTitle>
                      <CardDescription>
                        Configurazione dei privilegi assegnati ai singoli ruoli di sistema. Interagisci con i toggle per simulare l'aggiornamento.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Unsaved changes banner state */}
                  {hasUnsavedChanges ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span><strong>Modifiche locali non salvate:</strong> Ci sono variazioni ai permessi in questa sessione.</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
                        onClick={() => {
                          setHasUnsavedChanges(false);
                          addLog("Modifiche ai permessi salvate temporaneamente nella sessione locale.");
                        }}
                      >
                        Salva in Demo
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span><strong>Stato Sincronizzato:</strong> Tutte le modifiche della sessione locale sono salvate.</span>
                    </div>
                  )}

                  {/* Visual grouping of permissions */}
                  {["Visualizzazione", "Operativita'", "Configurazione"].map((cat) => {
                    const permsInCat = permissions.filter((p) => p.categoria === cat);
                    return (
                      <div key={cat} className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                          {cat}
                        </h3>
                        
                        <div className="space-y-4">
                          {permsInCat.map((p) => (
                            <div key={p.chiave} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
                              <div className="space-y-0.5 max-w-xs">
                                <div className="text-sm font-semibold">{p.descrizione}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">{p.chiave}</div>
                              </div>
                              
                              {/* Role switches */}
                              <div className="flex items-center gap-6 justify-end">
                                {/* Admin */}
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[9px] font-bold text-red-500 uppercase">Admin</span>
                                  <Switch
                                    checked={p.admin}
                                    onCheckedChange={() => togglePermission(p.chiave, "admin")}
                                  />
                                </div>

                                {/* Manager */}
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[9px] font-bold text-amber-500 uppercase">Manager</span>
                                  <Switch
                                    checked={p.manager}
                                    onCheckedChange={() => togglePermission(p.chiave, "manager")}
                                  />
                                </div>

                                {/* Staff */}
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[9px] font-bold text-blue-500 uppercase">Staff</span>
                                  <Switch
                                    checked={p.staff}
                                    onCheckedChange={() => togglePermission(p.chiave, "staff")}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                </CardContent>
              </div>
            </Card>

          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
