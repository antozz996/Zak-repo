import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { useListAuditLog } from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const azioneLabel: Record<string, string> = {
  create: "Creazione",
  update: "Modifica",
  delete: "Eliminazione",
  send: "Invio messaggio",
  mark_read: "Segna letto",
  assign: "Assegnazione",
  release: "Rilascio",
  trigger: "Trigger",
  update_config: "Config",
  import_csv: "Import CSV",
};

export default function AuditLog() {
  const [entita, setEntita] = useState("");
  const [azione, setAzione] = useState("");
  const params = {
    limit: 100,
    ...(entita ? { entita } : {}),
    ...(azione ? { azione } : {}),
  };
  const { data: logs, isLoading, refetch } = useListAuditLog(params);

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-muted-foreground">Registro delle azioni operative eseguite dallo staff nel CRM.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Aggiorna
          </Button>
        </div>

        <div className="border rounded-xl p-5 bg-background grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Entita</p>
            <Input placeholder="contatto, preventivo, agenda..." value={entita} onChange={(event) => setEntita(event.target.value)} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Azione</p>
            <Input placeholder="create, update, delete..." value={azione} onChange={(event) => setAzione(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => { setEntita(""); setAzione(""); }}>
              Pulisci filtri
            </Button>
          </div>
        </div>

        <div className="border rounded-xl bg-background overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Ultime azioni</h2>
          </div>

          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Caricamento audit log...</p>
          ) : logs?.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nessuna azione trovata con i filtri correnti.</p>
          ) : (
            <div className="divide-y">
              {logs?.map((log) => (
                <div key={log.id} className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[180px_1fr_180px] gap-3">
                  <div>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                      {azioneLabel[log.azione] || log.azione}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{log.entita}{log.entita_id ? ` #${log.entita_id.slice(0, 8)}` : ""}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{log.utente_nome || "staff_ui"}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.dettagli || "Nessun dettaglio aggiuntivo"}</p>
                  </div>
                  <div className="lg:text-right text-xs text-muted-foreground">
                    {format(new Date(log.data_creazione), "d MMM yyyy, HH:mm", { locale: it })}
                    {log.ip_address && <p className="mt-1">{log.ip_address}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
