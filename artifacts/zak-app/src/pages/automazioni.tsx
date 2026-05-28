import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListAutomazioniLog,
  useListAutomazioniConfig,
  useUpdateAutomazioneConfig,
  useTriggerAutomazione,
  getListAutomazioniLogQueryKey,
  getListAutomazioniConfigQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Play, RefreshCw, CheckCircle, AlertCircle, Settings2, ClipboardList } from "lucide-react";

const tipoLabel: Record<string, string> = {
  reengagement: "Re-engagement Lead Persi",
  ricorrenza: "Fidelizzazione Ricorrenza",
};

const tipoColore: Record<string, string> = {
  reengagement: "bg-amber-100 text-amber-800 border-amber-200",
  ricorrenza: "bg-purple-100 text-purple-800 border-purple-200",
};

const configLabel: Record<string, string> = {
  reengagement_mesi: "Mesi inattività per re-engagement",
  ricorrenza_mesi_anticipo: "Mesi anticipo per ricorrenze",
  reengagement_attivo: "Re-engagement attivo (true/false)",
  ricorrenza_attiva: "Ricorrenze attive (true/false)",
};

export default function Automazioni() {
  const qc = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<Record<string, string>>({});
  const [triggerResult, setTriggerResult] = useState<{ tipo: string; eseguiti: number; dettagli: string[] } | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useListAutomazioniLog({ limit: 30 });
  const { data: configs } = useListAutomazioniConfig();

  const updateConfig = useUpdateAutomazioneConfig();
  const triggerJob = useTriggerAutomazione();

  const salvaConfig = async (chiave: string) => {
    const nuovoValore = editingConfig[chiave];
    if (!nuovoValore) return;
    await updateConfig.mutateAsync({ chiave, data: { valore: nuovoValore } });
    await qc.invalidateQueries({ queryKey: getListAutomazioniConfigQueryKey() });
    setEditingConfig((prev) => { const n = { ...prev }; delete n[chiave]; return n; });
  };

  const avviaJob = async (tipo: string) => {
    setTriggering(tipo);
    setTriggerResult(null);
    try {
      const result = await triggerJob.mutateAsync({ data: { tipo } });
      setTriggerResult({ tipo, eseguiti: result.eseguiti, dettagli: result.dettagli || [] });
      await qc.invalidateQueries({ queryKey: getListAutomazioniLogQueryKey() });
    } finally {
      setTriggering(null);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Automazioni CRM</h1>
          <p className="text-muted-foreground">Gestione job automatici per re-engagement e fidelizzazione clienti.</p>
        </div>

        {/* Job cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Re-engagement */}
          <div className="border rounded-xl p-6 space-y-4 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base">Re-engagement Lead Persi</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Invia automaticamente un messaggio WhatsApp ai lead con stato "perso" dopo il periodo di inattività configurato.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0 ml-3">Giornaliero 09:00</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Attivazione: lead con <strong>stato_lead = perso</strong> e ultimo contatto {">"} X mesi fa</p>
              <p>Azione: invia messaggio di re-engagement via WhatsApp</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => avviaJob("reengagement")}
              disabled={triggering === "reengagement"}
              className="w-full"
            >
              {triggering === "reengagement" ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Esecuzione in corso...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Esegui Ora</>
              )}
            </Button>
          </div>

          {/* Ricorrenze */}
          <div className="border rounded-xl p-6 space-y-4 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base">Fidelizzazione Ricorrenze</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Propone automaticamente il rinnovo ai clienti con eventi confermati nell'anno precedente.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex-shrink-0 ml-3">Giornaliero 10:00</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Attivazione: evento <strong>confermato</strong> ricorrenza a X mesi di distanza</p>
              <p>Azione: invia proposta fidelizzazione per l'anno successivo</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => avviaJob("ricorrenza")}
              disabled={triggering === "ricorrenza"}
              className="w-full"
            >
              {triggering === "ricorrenza" ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Esecuzione in corso...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Esegui Ora</>
              )}
            </Button>
          </div>
        </div>

        {/* Risultato trigger manuale */}
        {triggerResult && (
          <div className={`border rounded-lg p-5 ${triggerResult.eseguiti > 0 ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
            <div className="flex items-center gap-2 mb-2">
              {triggerResult.eseguiti > 0
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <AlertCircle className="w-5 h-5 text-muted-foreground" />}
              <span className="font-semibold">
                {tipoLabel[triggerResult.tipo] || triggerResult.tipo} — {triggerResult.eseguiti} contatto{triggerResult.eseguiti !== 1 ? "i" : ""} elaborato{triggerResult.eseguiti !== 1 ? "i" : ""}
              </span>
            </div>
            {triggerResult.dettagli.length > 0 ? (
              <ul className="text-sm space-y-0.5 text-muted-foreground list-disc list-inside">
                {triggerResult.dettagli.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun contatto corrispondente ai criteri in questo momento.</p>
            )}
          </div>
        )}

        {/* Configurazione */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Configurazione</h2>
          </div>
          <div className="border rounded-lg divide-y bg-background">
            {configs?.map((config) => (
              <div key={config.chiave} className="flex items-center justify-between px-5 py-4 gap-6">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{configLabel[config.chiave] || config.chiave}</p>
                  {config.descrizione && (
                    <p className="text-xs text-muted-foreground mt-0.5">{config.descrizione}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Input
                    className="w-28 text-center"
                    value={editingConfig[config.chiave] ?? config.valore}
                    onChange={(e) => setEditingConfig((prev) => ({ ...prev, [config.chiave]: e.target.value }))}
                  />
                  {editingConfig[config.chiave] !== undefined && editingConfig[config.chiave] !== config.valore && (
                    <Button size="sm" onClick={() => salvaConfig(config.chiave)} disabled={updateConfig.isPending}>
                      Salva
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log esecuzioni */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Log Esecuzioni</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchLogs()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
            </Button>
          </div>

          {logsLoading ? (
            <p className="text-muted-foreground text-sm">Caricamento...</p>
          ) : logs?.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Nessuna esecuzione registrata. Avvia un job manualmente per vedere i risultati qui.
            </div>
          ) : (
            <div className="border rounded-lg divide-y bg-background">
              {logs?.map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-5 py-3">
                  <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold border flex-shrink-0 ${tipoColore[log.tipo] || "bg-muted text-muted-foreground"}`}>
                    {tipoLabel[log.tipo] || log.tipo}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.messaggio || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(log.data_esecuzione), "d MMM yyyy, HH:mm", { locale: it })}
                      {log.contatto_nome && <> · <span className="font-medium">{log.contatto_nome}</span></>}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${log.stato === "eseguito" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {log.stato}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
