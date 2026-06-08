import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ShieldAlert, ArrowLeft, Lock, ShieldCheck, User, Users } from "lucide-react";

export default function AccessDeniedMock() {
  return (
    <SidebarLayout>
      <div className="flex items-center justify-center min-h-[80vh] p-6">
        <Card className="w-full max-w-lg border-destructive/30 shadow-xl bg-destructive/[0.02]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-destructive">
              Accesso Non Autorizzato
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Non disponi delle autorizzazioni necessarie per visualizzare questa sezione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            
            {/* Simulation Context Details */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="font-semibold text-muted-foreground">Ruolo Corrente (Simulato):</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 font-bold flex items-center">
                  <User className="w-3.5 h-3.5 mr-1" /> OPERATORE STAFF
                </Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="font-semibold text-muted-foreground">Sezione Richiesta:</span>
                <span className="font-mono text-foreground font-semibold">/audit-log</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Permesso Mancante:</span>
                <span className="font-mono text-red-600 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 font-bold">audit.view</span>
              </div>
            </div>

            {/* Explanatory Copy */}
            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <strong>Se sei un membro dello Staff:</strong> Contatta l'Amministratore del locale se ritieni che questo messaggio sia un errore o se hai bisogno di accedere a questa sezione per completare un compito operativo.
              </p>
              <p>
                <strong>Nota per gli Sviluppatori (Codex):</strong> Questo errore viene scatenato dall'assenza della chiave di permesso richiesta all'interno del token JWT dell'operatore o a livello di database. La schermata definitiva utilizzera' questa struttura per proteggere le rotte sensibili.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full" variant="default">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Torna alla Dashboard
                </Button>
              </Link>
              <Link href="/login-mock" className="flex-1">
                <Button className="w-full" variant="outline">
                  <Lock className="w-4 h-4 mr-2" />
                  Cambia Ruolo Demo
                </Button>
              </Link>
            </div>

          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
