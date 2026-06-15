import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetGoogleCalendarStatusQueryKey,
  getGetProductionReadinessQueryKey,
  useGetGoogleCalendarStatus,
  useGetProductionReadiness,
  useSyncGoogleCalendar,
  type ProductionReadinessCheck,
} from "@workspace/api-client-react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudCog,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcwKey,
  ShieldCheck,
} from "lucide-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SyncDirection = "zak_to_google" | "google_to_zak" | "bidirectional";

const statusLabel: Record<ProductionReadinessCheck["status"], string> = {
  ok: "OK",
  warning: "Da completare",
  missing: "Bloccante",
};

const statusClass: Record<ProductionReadinessCheck["status"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  missing: "border-red-200 bg-red-50 text-red-800",
};

const providerSteps = [
  {
    title: "1. Sicurezza staff",
    detail: "Verifica segreti auth, ruota le chiavi condivise fuori dal secret manager e cambia le password demo degli utenti staff.",
    env: ["DATABASE_URL", "NODE_ENV", "ZAK_AUTH_SECRET", "ZAK_BOOTSTRAP_ADMIN_TOKEN"],
    test: "Login staff e gestione utenti da Impostazioni.",
  },
  {
    title: "2. LLM Booking",
    detail: "Abilita l'estrazione AI solo quando la chiave provider e` presente. Il fallback rule-based resta attivo se il provider fallisce.",
    env: ["ZAK_LLM_BOOKING_ENABLED", "OPENAI_API_KEY", "OPENAI_BASE_URL", "ZAK_LLM_BOOKING_MODEL"],
    test: "Messaggio lead in Inbox con creazione/aggiornamento contatto e preventivo.",
  },
  {
    title: "3. Meta WhatsApp",
    detail: "Configura Cloud API, firma webhook e verify token nel pannello Meta Business.",
    env: ["META_WHATSAPP_ACCESS_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID", "META_APP_SECRET", "META_WEBHOOK_VERIFY_TOKEN"],
    test: "Messaggio WhatsApp reale ricevuto in Inbox.",
  },
  {
    title: "4. Google Calendar",
    detail: "Attiva OAuth server-side solo se vuoi davvero Google Calendar. Se lavori da Apple Numbers, lascia Google disattivato e usa l'import dedicato dalla pagina Agenda.",
    env: ["ZAK_GOOGLE_CALENDAR_ENABLED", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GOOGLE_CALENDAR_ID"],
    test: "Sync manuale Google completato senza errori.",
  },
  {
    title: "5. Voice assistant",
    detail: "Configura il webhook nel provider voice e passa il secret supportato negli header.",
    env: ["VOICE_WEBHOOK_SECRET", "VAPI_WEBHOOK_SECRET", "BLAND_WEBHOOK_SECRET"],
    test: "Chiamata demo con creazione contatto, messaggio voice, task o agenda.",
  },
  {
    title: "6. Smoke finale",
    detail: "Dopo ogni modifica env esegui redeploy/restart Render, aggiorna questa pagina e controlla i moduli operativi.",
    env: ["Render redeploy", "Go-live refresh"],
    test: "Inbox, Preventivi, Agenda, B2B, Automazioni e Audit Log senza errori.",
  },
];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function missingEnv(check: ProductionReadinessCheck) {
  const configured = new Set(check.configured_env ?? []);
  return (check.required_env ?? []).filter((key) => !configured.has(key));
}

function StatusIcon({ status }: { status: ProductionReadinessCheck["status"] }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "missing") return <AlertTriangle className="h-4 w-4" />;
  return <KeyRound className="h-4 w-4" />;
}

function EnvPills({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessuna variabile da inserire.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="outline" className="font-mono text-xs">
          {value}
        </Badge>
      ))}
    </div>
  );
}

function ReadinessRow({ check }: { check: ProductionReadinessCheck }) {
  const missing = missingEnv(check);

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <StatusIcon status={check.status} />
            <h3 className="font-semibold">{check.key}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{check.message}</p>
          {check.action ? <p className="mt-2 text-sm">{check.action}</p> : null}
        </div>
        <Badge className={statusClass[check.status]} variant="outline">
          {statusLabel[check.status]}
        </Badge>
      </div>

      {missing.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Da configurare</p>
          <EnvPills values={missing} />
        </div>
      ) : null}

      {check.optional_env && check.optional_env.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Opzionali utili</p>
          <EnvPills values={check.optional_env} />
        </div>
      ) : null}
    </div>
  );
}

function ProviderStepCard({ step }: { step: (typeof providerSteps)[number] }) {
  return (
    <div className="rounded-md border p-4">
      <h3 className="font-semibold">{step.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Env / azioni</p>
        <EnvPills values={step.env} />
      </div>
      <p className="mt-3 text-sm">
        <span className="font-semibold">Test:</span> {step.test}
      </p>
    </div>
  );
}

export default function GoLive() {
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState<SyncDirection>("bidirectional");
  const readiness = useGetProductionReadiness();
  const google = useGetGoogleCalendarStatus();
  const syncGoogle = useSyncGoogleCalendar();

  const checks = readiness.data?.checks ?? [];
  const missingKeys = useMemo(() => unique(checks.flatMap((check) => missingEnv(check))), [checks]);
  const blockingCount = checks.filter((check) => check.status === "missing").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const okCount = checks.filter((check) => check.status === "ok").length;

  const runGoogleSync = async () => {
    await syncGoogle.mutateAsync({
      data: {
        direction,
        full_sync: direction !== "zak_to_google",
        days_ahead: 180,
      },
    });
    await queryClient.invalidateQueries({ queryKey: getGetGoogleCalendarStatusQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getGetProductionReadinessQueryKey() });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CloudCog className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Go-live</h1>
            </div>
            <p className="text-muted-foreground">
              Stato produzione, integrazioni e variabili da completare prima del collegamento reale dei provider.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void readiness.refetch();
              void google.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Aggiorna
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border bg-background p-4">
            <p className="text-2xl font-bold">{okCount}</p>
            <p className="text-xs text-muted-foreground">Check OK</p>
          </div>
          <div className="rounded-md border bg-background p-4">
            <p className="text-2xl font-bold">{warningCount}</p>
            <p className="text-xs text-muted-foreground">Da completare</p>
          </div>
          <div className="rounded-md border bg-background p-4">
            <p className="text-2xl font-bold">{blockingCount}</p>
            <p className="text-xs text-muted-foreground">Bloccanti</p>
          </div>
          <div className="rounded-md border bg-background p-4">
            <p className="text-2xl font-bold">{missingKeys.length}</p>
            <p className="text-xs text-muted-foreground">Variabili mancanti</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Variabili da consegnare
            </CardTitle>
            <CardDescription>
              Quando questa lista e` vuota, l'app e` pronta lato codice e restano solo test provider/deploy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {readiness.isLoading ? (
              <p className="text-sm text-muted-foreground">Caricamento readiness...</p>
            ) : (
              <EnvPills values={missingKeys} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcwKey className="h-5 w-5" />
              Sequenza operativa
            </CardTitle>
            <CardDescription>
              Inserisci le chiavi solo nel pannello Render o nei provider: non salvarle nel repository e non condividerle in chat.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {providerSteps.map((step) => (
              <ProviderStepCard key={step.title} step={step} />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Checklist produzione</CardTitle>
              <CardDescription>Stato letto direttamente dal backend protetto admin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {readiness.isLoading ? (
                <p className="text-sm text-muted-foreground">Caricamento controlli...</p>
              ) : checks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun controllo disponibile.</p>
              ) : (
                checks.map((check) => <ReadinessRow key={check.key} check={check} />)
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>Sync manuale disponibile appena le chiavi OAuth sono configurate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {google.isLoading ? (
                  <p className="text-sm text-muted-foreground">Caricamento stato Google...</p>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Abilitato</span>
                        <Badge variant={google.data?.enabled ? "default" : "outline"}>
                          {google.data?.enabled ? "Si" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Configurato</span>
                        <Badge variant={google.data?.configured ? "default" : "outline"}>
                          {google.data?.configured ? "Si" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Calendario</span>
                        <span className="font-mono text-xs">{google.data?.calendar_id ?? "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Sync token</span>
                        <span>{google.data?.sync_token_available ? "Presente" : "Assente"}</span>
                      </div>
                    </div>

                    {google.data?.required_env && google.data.required_env.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Google mancanti</p>
                        <EnvPills values={google.data.required_env} />
                      </div>
                    ) : null}

                    {google.data?.last_error ? (
                      <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                        {google.data.last_error}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Select value={direction} onValueChange={(value) => setDirection(value as SyncDirection)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bidirectional">Bidirezionale</SelectItem>
                          <SelectItem value="zak_to_google">ZAK verso Google</SelectItem>
                          <SelectItem value="google_to_zak">Google verso ZAK</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="w-full"
                        onClick={() => void runGoogleSync()}
                        disabled={!google.data?.configured || syncGoogle.isPending}
                      >
                        {syncGoogle.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Avvia sync Google
                      </Button>
                    </div>

                    {syncGoogle.data ? (
                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-semibold">{syncGoogle.data.message}</p>
                        <p className="mt-1 text-muted-foreground">
                          Push {syncGoogle.data.pushed}, pull {syncGoogle.data.pulled}, conflitti {syncGoogle.data.conflicts}.
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endpoint provider</CardTitle>
                <CardDescription>URL da configurare nei pannelli esterni.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">WhatsApp Meta</p>
                  <p className="font-mono text-xs text-muted-foreground">/api/webhook/whatsapp</p>
                </div>
                <div>
                  <p className="font-semibold">Voice assistant</p>
                  <p className="font-mono text-xs text-muted-foreground">/api/webhook/voice-assistant</p>
                </div>
                <div>
                  <p className="font-semibold">Google Calendar watch</p>
                  <p className="font-mono text-xs text-muted-foreground">/api/webhook/google-calendar</p>
                </div>
                <div>
                  <p className="font-semibold">Import interno Apple Numbers</p>
                  <p className="font-mono text-xs text-muted-foreground">/agenda/importa-numbers</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
