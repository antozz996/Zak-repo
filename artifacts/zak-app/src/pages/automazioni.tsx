import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListAutomazioniLog,
  useListAutomazioniConfig,
  useGetAutomazioniPerformance,
  useUpdateAutomazioneConfig,
  useTriggerAutomazione,
  getListAutomazioniLogQueryKey,
  getListAutomazioniConfigQueryKey,
  getGetAutomazioniPerformanceQueryKey,
  getListWhatsappTemplatesQueryKey,
  getListWhatsappLogsQueryKey,
  useListWhatsappTemplates,
  useListWhatsappLogs,
  useUpdateWhatsappTemplate,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Play, RefreshCw, CheckCircle, AlertCircle, Settings2, ClipboardList, MessageSquareShare } from "lucide-react";

const tipoLabel: Record<string, string> = {
  reengagement: "Re-engagement Lead Persi",
  ricorrenza: "Fidelizzazione Ricorrenza",
  promemoria: "Promemoria Agenda",
  promemoria_pagamento: "Promemoria Pagamento",
};

const tipoColore: Record<string, string> = {
  reengagement: "bg-amber-100 text-amber-800 border-amber-200",
  ricorrenza: "bg-purple-100 text-purple-800 border-purple-200",
  promemoria: "bg-blue-100 text-blue-800 border-blue-200",
  promemoria_pagamento: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const configLabel: Record<string, string> = {
  reengagement_mesi: "Mesi inattivita' per re-engagement",
  ricorrenza_mesi_anticipo: "Mesi anticipo per ricorrenze",
  reengagement_attivo: "Re-engagement attivo (true/false)",
  ricorrenza_attiva: "Ricorrenze attive (true/false)",
  reengagement_tipi_evento: "Tipi evento per re-engagement",
  ricorrenza_tipi_evento: "Tipi evento per ricorrenze",
  promemoria_attivo: "Promemoria agenda attivi (true/false)",
  promemoria_minuti_anticipo: "Minuti anticipo promemoria agenda",
  promemoria_pagamenti_attivo: "Promemoria pagamenti attivi (true/false)",
  promemoria_pagamenti_giorni_anticipo: "Giorni anticipo promemoria pagamenti",
  booking_assistant_template_nome: "Zak AI - richiesta nome",
  booking_assistant_template_tipo_evento: "Zak AI - richiesta tipo evento",
  booking_assistant_template_data_evento: "Zak AI - richiesta data evento",
  booking_assistant_template_numero_invitati: "Zak AI - richiesta invitati",
  booking_assistant_template_completo: "Zak AI - lead qualificato",
  booking_assistant_template_handoff: "Zak AI - handoff a operatore",
  booking_assistant_template_data_occupata: "Zak AI - data occupata",
  booking_assistant_template_data_disponibile: "Zak AI - data disponibile",
};

const configHelp: Record<string, string> = {
  reengagement_tipi_evento: "Usa all per tutti oppure valori separati da virgola: diciottesimo, laurea, compleanno, matrimonio, aziendale.",
  ricorrenza_tipi_evento: "Usa all per tutti oppure limita le ricorrenze a specifici tipi evento.",
  promemoria_minuti_anticipo: "Il job registra promemoria per eventi agenda futuri entro questa finestra.",
  promemoria_pagamenti_giorni_anticipo: "Finestra giorni entro cui inviare il template Meta di promemoria rata.",
  booking_assistant_template_nome: "Placeholder disponibili: {{nome}}.",
  booking_assistant_template_tipo_evento: "Placeholder disponibili: {{nome}}.",
  booking_assistant_template_data_evento: "Placeholder disponibili: {{nome}}, {{tipo_evento}}.",
  booking_assistant_template_numero_invitati: "Messaggio inviato quando manca il numero invitati.",
  booking_assistant_template_completo: "Placeholder disponibili: {{nome}}, {{tipo_evento}}, {{data_evento}}, {{numero_invitati}}.",
  booking_assistant_template_handoff: "Messaggio finale prima di fermare Zak AI e passare allo staff.",
  booking_assistant_template_data_occupata: "Placeholder disponibili: {{data_evento}}, {{alternative}}.",
  booking_assistant_template_data_disponibile: "Placeholder disponibili: {{data_evento}}.",
};

function validateConfigValue(chiave: string, valore: string) {
  const normalized = valore.trim();
  if (!normalized) return "Valore obbligatorio.";
  if (["reengagement_attivo", "ricorrenza_attiva", "promemoria_attivo", "promemoria_pagamenti_attivo"].includes(chiave)) {
    return ["true", "false"].includes(normalized.toLowerCase()) ? null : "Usa solo true oppure false.";
  }
  if (["reengagement_mesi", "ricorrenza_mesi_anticipo", "promemoria_pagamenti_giorni_anticipo"].includes(chiave)) {
    const months = Number(normalized);
    return Number.isInteger(months) && months >= 1 && months <= 60 ? null : "Inserisci un numero intero tra 1 e 60.";
  }
  if (chiave === "promemoria_minuti_anticipo") {
    const minutes = Number(normalized);
    return Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440 ? null : "Inserisci un numero intero tra 1 e 1440.";
  }
  return null;
}

export default function Automazioni() {
  const qc = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<Record<string, string>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [triggerResult, setTriggerResult] = useState<{ tipo: string; eseguiti: number; dettagli: string[] } | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useListAutomazioniLog({ limit: 30 });
  const { data: configs } = useListAutomazioniConfig();
  const { data: performance, isLoading: performanceLoading } = useGetAutomazioniPerformance();
  const { data: whatsappTemplates = [] } = useListWhatsappTemplates();
  const { data: whatsappLogs = [] } = useListWhatsappLogs({ limit: 6 });

  const updateConfig = useUpdateAutomazioneConfig();
  const triggerJob = useTriggerAutomazione();
  const updateWhatsappTemplate = useUpdateWhatsappTemplate();

  const salvaConfig = async (chiave: string) => {
    const nuovoValore = editingConfig[chiave];
    if (!nuovoValore) return;
    const error = validateConfigValue(chiave, nuovoValore);
    if (error) {
      setConfigErrors((prev) => ({ ...prev, [chiave]: error }));
      return;
    }
    await updateConfig.mutateAsync({ chiave, data: { valore: nuovoValore } });
    await qc.invalidateQueries({ queryKey: getListAutomazioniConfigQueryKey() });
    setEditingConfig((prev) => { const n = { ...prev }; delete n[chiave]; return n; });
    setConfigErrors((prev) => { const n = { ...prev }; delete n[chiave]; return n; });
  };

  const avviaJob = async (tipo: string) => {
    setTriggering(tipo);
    setTriggerResult(null);
    try {
      const result = await triggerJob.mutateAsync({ data: { tipo } });
      setTriggerResult({ tipo, eseguiti: result.eseguiti, dettagli: result.dettagli || [] });
      await qc.invalidateQueries({ queryKey: getListAutomazioniLogQueryKey() });
      await qc.invalidateQueries({ queryKey: getGetAutomazioniPerformanceQueryKey() });
    } finally {
      setTriggering(null);
    }
  };

  const salvaTemplate = async (id: string, field: "template_name" | "status" | "body_preview", value: string) => {
    await updateWhatsappTemplate.mutateAsync({
      id,
      data: { [field]: value },
    });
    await qc.invalidateQueries({ queryKey: getListWhatsappTemplatesQueryKey() });
    await qc.invalidateQueries({ queryKey: getListWhatsappLogsQueryKey({ limit: 6 }) });
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Automazioni CRM</h1>
          <p className="text-muted-foreground">Gestione job automatici per re-engagement, fidelizzazione e promemoria agenda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded-xl p-5 bg-background">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Esecuzioni totali</p>
            <p className="text-3xl font-bold mt-2">{performanceLoading ? "..." : performance?.totale ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Log automazioni registrati</p>
          </div>
          <div className="border rounded-xl p-5 bg-green-50 border-green-200">
            <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">Successo</p>
            <p className="text-3xl font-bold mt-2 text-green-800">{performanceLoading ? "..." : `${performance?.tasso_successo ?? 0}%`}</p>
            <p className="text-xs text-green-700 mt-1">{performance?.eseguiti ?? 0} eseguite</p>
          </div>
          <div className="border rounded-xl p-5 bg-amber-50 border-amber-200">
            <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Saltate</p>
            <p className="text-3xl font-bold mt-2 text-amber-800">{performanceLoading ? "..." : performance?.saltati ?? 0}</p>
            <p className="text-xs text-amber-700 mt-1">Fallback o criteri non validi</p>
          </div>
          <div className="border rounded-xl p-5 bg-red-50 border-red-200">
            <p className="text-xs uppercase tracking-wide text-red-700 font-semibold">Errori</p>
            <p className="text-3xl font-bold mt-2 text-red-800">{performanceLoading ? "..." : performance?.errori ?? 0}</p>
            <p className="text-xs text-red-700 mt-1">{performance?.ultimi_30_giorni ?? 0} negli ultimi 30 giorni</p>
          </div>
        </div>

        {performance?.per_tipo && performance.per_tipo.length > 0 && (
          <div className="border rounded-xl p-5 bg-background space-y-3">
            <h2 className="font-semibold text-base">Performance per automazione</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {performance.per_tipo.map((item) => (
                <div key={item.tipo} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${tipoColore[item.tipo] || "bg-muted text-muted-foreground"}`}>
                      {tipoLabel[item.tipo] || item.tipo}
                    </span>
                    <span className="text-sm text-muted-foreground">{item.totale} totali</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <span className="text-green-700">{item.eseguiti} eseguite</span>
                    <span className="text-amber-700">{item.saltati} saltate</span>
                    <span className="text-red-700">{item.errori} errori</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Re-engagement */}
          <div className="border rounded-xl p-6 space-y-4 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base">Re-engagement Lead Persi</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Invia automaticamente un messaggio WhatsApp ai lead con stato "perso" dopo il periodo di inattivita' configurato.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0 ml-3">Giornaliero 09:00</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Attivazione: lead con <strong>stato_lead = perso</strong> e ultimo contatto {">"} X mesi fa</p>
              <p>Segmentazione: rispetta i tipi evento configurati</p>
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
              <p>Segmentazione: rispetta i tipi evento configurati</p>
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

          {/* Promemoria agenda */}
          <div className="border rounded-xl p-6 space-y-4 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base">Promemoria Agenda</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Registra nel log operativo gli impegni agenda imminenti e li marca come promemoria inviato.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex-shrink-0 ml-3">Ogni 15 min</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Attivazione: evento agenda futuro non ancora notificato</p>
              <p>Finestra: X minuti configurabili prima dell'inizio</p>
              <p>Azione: registra log e marca <strong>promemoria_inviato</strong></p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => avviaJob("promemoria")}
              disabled={triggering === "promemoria"}
              className="w-full"
            >
              {triggering === "promemoria" ? (
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
                {tipoLabel[triggerResult.tipo] || triggerResult.tipo} - {triggerResult.eseguiti} element{triggerResult.eseguiti !== 1 ? "i" : "o"} elaborat{triggerResult.eseguiti !== 1 ? "i" : "o"}
              </span>
            </div>
            {triggerResult.dettagli.length > 0 ? (
              <ul className="text-sm space-y-0.5 text-muted-foreground list-disc list-inside">
                {triggerResult.dettagli.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun elemento corrispondente ai criteri in questo momento.</p>
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
                  {configHelp[config.chiave] && (
                    <p className="text-xs text-muted-foreground mt-0.5">{configHelp[config.chiave]}</p>
                  )}
                  {configErrors[config.chiave] && (
                    <p className="text-xs text-red-600 mt-1">{configErrors[config.chiave]}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Input
                    className={config.chiave.includes("tipi_evento") || config.chiave.includes("template") ? "w-72 md:w-96" : "w-28 text-center"}
                    value={editingConfig[config.chiave] ?? config.valore}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditingConfig((prev) => ({ ...prev, [config.chiave]: value }));
                      const error = validateConfigValue(config.chiave, value);
                      setConfigErrors((prev) => {
                        const next = { ...prev };
                        if (error) next[config.chiave] = error;
                        else delete next[config.chiave];
                        return next;
                      });
                    }}
                  />
                  {editingConfig[config.chiave] !== undefined && editingConfig[config.chiave] !== config.valore && (
                    <Button size="sm" onClick={() => salvaConfig(config.chiave)} disabled={updateConfig.isPending || Boolean(configErrors[config.chiave])}>
                      Salva
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquareShare className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Template WhatsApp</h2>
          </div>
          <div className="space-y-3">
            {whatsappTemplates.map((template) => (
              <div key={template.id} className="rounded-lg border bg-background p-4">
                <div className="grid gap-4 lg:grid-cols-[220px_1fr_160px]">
                  <div>
                    <p className="font-medium text-sm">{template.display_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{template.trigger_key}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome template Meta</Label>
                    <Input
                      defaultValue={template.template_name ?? ""}
                      placeholder="es. invio_preventivo_zak"
                      onBlur={(event) => void salvaTemplate(template.id, "template_name", event.target.value)}
                    />
                    <Label>Preview</Label>
                    <Input
                      defaultValue={template.body_preview ?? ""}
                      placeholder="Testo con placeholder approvato in Meta"
                      onBlur={(event) => void salvaTemplate(template.id, "body_preview", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={template.status}
                      onChange={(event) => void salvaTemplate(template.id, "status", event.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="disabled">disabled</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      I trigger live usano queste mappature per `nuovo_lead`, `promemoria_pagamento` e `invio_preventivo`.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-background">
            <div className="border-b px-4 py-3">
              <p className="font-medium text-sm">Ultimi log template</p>
            </div>
            <div className="divide-y">
              {whatsappLogs.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">Nessun invio template registrato.</div>
              ) : (
                whatsappLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{log.trigger_key || log.template_name || "template"}</p>
                      <p className="text-xs text-muted-foreground">{log.destinatario}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      log.stato_invio === "sent"
                        ? "bg-green-100 text-green-700"
                        : log.stato_invio === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                    >
                      {log.stato_invio}
                    </span>
                  </div>
                ))
              )}
            </div>
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
