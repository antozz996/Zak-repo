import { useState } from "react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { CheckCircle2, FileText, Loader2, Signature, TriangleAlert } from "lucide-react";
import { getGetPublicQuoteQueryKey, useAcceptPublicQuote, useGetPublicQuote } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatCurrency(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "0");
  if (!value || Number.isNaN(parsed)) {
    return "Da definire";
  }
  return parsed.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export default function PublicQuotePage({ params: propsParams }: { params?: { token?: string } }) {
  const [, routeParams] = useRoute("/condividi/:token");
  const [, routeParamsTrailing] = useRoute("/condividi/:token/");
  const token = propsParams?.token ?? routeParams?.token ?? routeParamsTrailing?.token ?? "";
  const [signatureName, setSignatureName] = useState("");
  const [signatureSvg, setSignatureSvg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { data, isLoading, isError } = useGetPublicQuote(token, {
    query: { queryKey: getGetPublicQuoteQueryKey(token), enabled: !!token },
  });
  const acceptQuote = useAcceptPublicQuote();

  const isAlreadyAccepted = Boolean(data?.accepted_at);

  const handleAccept = async () => {
    if (!token || !signatureName.trim()) {
      return;
    }

    await acceptQuote.mutateAsync({
      token,
      data: {
        signature_name: signatureName.trim(),
        signature_svg: signatureSvg.trim() || undefined,
      },
    });
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Caricamento preventivo...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-red-600" />
              Link non valido
            </CardTitle>
            <CardDescription>Il preventivo condiviso non e disponibile oppure il token non e piu valido.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted || isAlreadyAccepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Evento confermato
            </CardTitle>
            <CardDescription>
              La conferma digitale e stata registrata con successo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Preventivo: {data.id}</p>
            <p>Cliente: {data.contatto_nome ?? "Da definire"}</p>
            {data.accepted_at ? <p>Confermato il: {format(new Date(data.accepted_at), "dd/MM/yyyy HH:mm")}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Conferma Evento Zak</p>
          <h1 className="text-3xl font-semibold">{data.contatto_nome ?? "Preventivo evento"}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Controlla i dati del tuo evento e conferma digitalmente il preventivo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Riepilogo evento
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tipo evento</p>
                <p className="text-sm">{data.tipo_evento ?? "Da definire"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Data richiesta</p>
                <p className="text-sm">{data.data_evento_richiesta ? format(new Date(`${data.data_evento_richiesta}T12:00:00`), "dd/MM/yyyy") : "Da definire"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Invitati</p>
                <p className="text-sm">{data.numero_invitati ?? "Da definire"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                <p className="text-sm">{formatCurrency(data.budget_stimato)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Note</p>
                <p className="whitespace-pre-wrap text-sm">{data.note || "Nessuna nota inserita."}</p>
              </div>
              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Menu cibo</p>
                  <p className="whitespace-pre-wrap text-sm">{data.menu_cibo || "Da definire"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Menu bevande</p>
                  <p className="whitespace-pre-wrap text-sm">{data.menu_bevande || "Da definire"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signature className="h-5 w-5" />
                Conferma digitale
              </CardTitle>
              <CardDescription>
                La conferma blocca l'evento e registra il primo stato operativo come confermato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-name">Nome e cognome</Label>
                <Input
                  id="signature-name"
                  value={signatureName}
                  onChange={(event) => setSignatureName(event.target.value)}
                  placeholder="Inserisci il nominativo del firmatario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature-svg">Firma grafica (facoltativa)</Label>
                <Textarea
                  id="signature-svg"
                  value={signatureSvg}
                  onChange={(event) => setSignatureSvg(event.target.value)}
                  className="min-h-28"
                  placeholder="Campo pronto per provider firma o tracciato SVG"
                />
              </div>
              {acceptQuote.isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Non siamo riusciti a registrare la conferma. Controlla il link o riprova tra poco.
                </div>
              ) : null}
              <Button className="w-full" onClick={() => void handleAccept()} disabled={acceptQuote.isPending || !signatureName.trim()}>
                {acceptQuote.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accetta e Conferma Evento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
