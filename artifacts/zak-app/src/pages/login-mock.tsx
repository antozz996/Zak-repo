import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldAlert, ShieldCheck, User, Users, Lock, Info, CheckCircle2 } from "lucide-react";

export default function LoginMock() {
  const [selectedRole, setSelectedRole] = useState<"admin" | "manager" | "staff" | null>(null);
  const [simulatedLoginMsg, setSimulatedLoginMsg] = useState<string | null>(null);

  const handleSimulateLogin = (role: "admin" | "manager" | "staff") => {
    setSelectedRole(role);
    const roleLabels = {
      admin: "Amministratore",
      manager: "Venue Manager",
      staff: "Operatore Staff"
    };
    setSimulatedLoginMsg(`Accesso simulato completato con successo come: ${roleLabels[role]}.`);
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Lock className="w-8 h-8 text-primary" />
                Login Mock Staff
              </h1>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/5">
                Demo
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Simula il flusso di autenticazione dell'applicazione ed esplora i privilegi di ciascun ruolo staff.
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span><strong>Stato Demo:</strong> Questa pagina serve per scopi prototipali. Non genera cookie di sessione ne' richiede password reali.</span>
        </div>

        {/* Success log */}
        {simulatedLoginMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl text-xs space-y-1 animate-fade-in">
            <p className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Simulazione Login
            </p>
            <p className="text-emerald-950">{simulatedLoginMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Side: Select Role Form (5 Cols) */}
          <div className="md:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Porta di Accesso Demo</CardTitle>
                <CardDescription>Seleziona un ruolo per avviare una sessione fittizia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email dell'operatore</Label>
                  <input
                    type="email"
                    disabled
                    placeholder="seleziona_ruolo@villazak.com"
                    className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm transition-colors cursor-not-allowed opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••••••"
                    className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm transition-colors cursor-not-allowed opacity-70"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <Label className="text-xs text-muted-foreground">Scegli un Ruolo da simulare:</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={selectedRole === "admin" ? "default" : "outline"}
                      onClick={() => handleSimulateLogin("admin")}
                      className="justify-start gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-500" />
                      Amministratore (Admin)
                    </Button>
                    <Button
                      variant={selectedRole === "manager" ? "default" : "outline"}
                      onClick={() => handleSimulateLogin("manager")}
                      className="justify-start gap-2"
                    >
                      <Users className="w-4 h-4 text-amber-500" />
                      Venue Manager (Manager)
                    </Button>
                    <Button
                      variant={selectedRole === "staff" ? "default" : "outline"}
                      onClick={() => handleSimulateLogin("staff")}
                      className="justify-start gap-2"
                    >
                      <User className="w-4 h-4 text-blue-500" />
                      Operatore Staff (Staff)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Security info and Roles differences (7 Cols) */}
          <div className="md:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Architettura di Autenticazione (RBAC)</CardTitle>
                <CardDescription>Come verra' gestita la sicurezza nel core reale del sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Nel sistema definitivo gestito da **Codex**, il meccanismo di autenticazione e sicurezza sara' cosi' strutturato:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li>
                    <strong>Token JWT in Cookie Sicuri</strong>: All'autenticazione verra' emesso un token JWT inserito in un cookie con flag <code>HttpOnly</code>, <code>Secure</code> e <code>SameSite=Strict</code> per prevenire attacchi XSS e CSRF.
                  </li>
                  <li>
                    <strong>Durata Sessione e Refresh</strong>: La sessione avra' una validita' standard di 12 ore, estendibile a 7 giorni se l'operatore seleziona "Rimani Connesso". Dopo 30 minuti di inattivita', lo schermo verra' bloccato per sicurezza.
                  </li>
                  <li>
                    <strong>Audit Log e Governance</strong>: Qualsiasi tentativo di accesso a endpoint non autorizzati, login fallito o modifica dei ruoli sara' registrato con data, ora, IP e user-agent nell'Audit Log di sistema.
                  </li>
                </ul>

                <div className="pt-4 border-t border-border space-y-3">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Privilegi dei Ruoli</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-lg space-y-1">
                      <p className="font-bold text-red-600 text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> AMMINISTRATORE (Admin)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Controllo globale su tutte le venue, modifica delle chiavi API (Meta, Vapi, Google Sync), abilitazione/disattivazione e promozione degli operatori dello staff.
                      </p>
                    </div>

                    <div className="p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg space-y-1">
                      <p className="font-bold text-amber-600 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> VENUE MANAGER (Manager)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coordinamento commerciale. Gestione preventivi ed eventi, configurazione dei template WhatsApp e delle automazioni, e monitoraggio delle performance commerciali.
                      </p>
                    </div>

                    <div className="p-3 border border-blue-500/20 bg-blue-500/5 rounded-lg space-y-1">
                      <p className="font-bold text-blue-600 text-xs flex items-center gap-1.5">
                        <User className="w-4 h-4" /> OPERATORE STAFF (Staff)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Operativita' quotidiana. Risposta ai messaggi WhatsApp, gestione dello stato dell'assistente AI (pausa/avvio), spunta dei task assegnati e note interne del CRM.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
