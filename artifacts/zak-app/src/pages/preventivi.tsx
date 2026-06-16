import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListPreventivi,
  useListContatti,
  useCreatePreventivo,
  useUpdatePreventivo,
  useDeletePreventivo,
  useCalculatePreventivoPricing,
  useCalculatePreventivoFoodCost,
  useSendPreventivoWhatsApp,
  useConfirmPreventivoDigitale,
  getDownloadPreventivoPdfUrl,
  getListPreventiviQueryKey,
  type PreventivoPricingInput,
  type PreventivoFoodCostResult,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, Pencil, Trash2, AlertCircle, FileText, Calculator, Send, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Preventivo = {
  id: string;
  contatto_id: string;
  contatto_nome?: string | null;
  data_evento_richiesta?: string | null;
  numero_invitati?: number | null;
  budget_stimato?: number | string | null;
  note?: string | null;
  stato_evento: string;
  data_creazione: string;
};

const statoColore: Record<string, string> = {
  opzionato: "bg-amber-100 text-amber-800",
  confermato: "bg-green-100 text-green-800",
  rifiutato: "bg-gray-100 text-gray-700",
};

const statoLabel: Record<string, string> = {
  opzionato: "Opzionato",
  confermato: "Confermato",
  rifiutato: "Rifiutato",
};

const vuoto = {
  contatto_id: "",
  data_evento_richiesta: "",
  numero_invitati: "",
  budget_stimato: "",
  note: "",
  stato_evento: "opzionato",
};

const pricingExtras: Array<{ value: NonNullable<PreventivoPricingInput["extra"]>[number]; label: string }> = [
  { value: "open_bar", label: "Open bar" },
  { value: "dj_set", label: "DJ set" },
  { value: "fotografo", label: "Fotografo" },
  { value: "allestimento", label: "Allestimento" },
  { value: "torta", label: "Torta" },
  { value: "sicurezza", label: "Sicurezza" },
];

const parseBudget = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return 0;
  return typeof value === "number" ? value : parseFloat(value);
};

const parseNumberField = (value: string, fallback = 0) => {
  if (!value.trim()) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value?: number | null) =>
  typeof value === "number"
    ? value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })
    : "-";

export default function Preventivi() {
  const qc = useQueryClient();
  const [filtroStato, setFiltroStato] = useState("all");
  const [drawerAperto, setDrawerAperto] = useState(false);
  const [selezionato, setSelezionato] = useState<Preventivo | null>(null);
  const [form, setForm] = useState(vuoto);
  const [pricingForm, setPricingForm] = useState<{
    pacchetto: PreventivoPricingInput["pacchetto"];
    extra: NonNullable<PreventivoPricingInput["extra"]>;
  }>({ pacchetto: "standard", extra: [] });
  const [foodCostForm, setFoodCostForm] = useState({
    costo_food_per_persona: "18",
    costo_bevande_per_persona: "5",
    costo_extra_fisso: "0",
    percentuale_target: "30",
  });
  const [errore, setErrore] = useState("");

  const { data: preventivi, isLoading, isError, refetch } = useListPreventivi({
    stato_evento: filtroStato !== "all" ? filtroStato : undefined,
  });

  const { data: contatti } = useListContatti();

  const crea = useCreatePreventivo();
  const aggiorna = useUpdatePreventivo();
  const elimina = useDeletePreventivo();
  const calcolaPrezzo = useCalculatePreventivoPricing();
  const calcolaFoodCost = useCalculatePreventivoFoodCost();
  const inviaWhatsApp = useSendPreventivoWhatsApp();
  const confermaDigitaleMutation = useConfirmPreventivoDigitale();

  const invalida = () => qc.invalidateQueries({ queryKey: getListPreventiviQueryKey() });

  const apriNuovo = () => {
    setSelezionato(null);
    setForm(vuoto);
    setPricingForm({ pacchetto: "standard", extra: [] });
    calcolaPrezzo.reset();
    calcolaFoodCost.reset();
    setFoodCostForm({
      costo_food_per_persona: "18",
      costo_bevande_per_persona: "5",
      costo_extra_fisso: "0",
      percentuale_target: "30",
    });
    setErrore("");
    setDrawerAperto(true);
  };

  const apriModifica = (p: Preventivo) => {
    setSelezionato(p);
    setForm({
      contatto_id: p.contatto_id,
      data_evento_richiesta: p.data_evento_richiesta || "",
      numero_invitati: p.numero_invitati?.toString() || "",
      budget_stimato: p.budget_stimato?.toString() || "",
      note: p.note || "",
      stato_evento: p.stato_evento,
    });
    setPricingForm({ pacchetto: "standard", extra: [] });
    calcolaPrezzo.reset();
    calcolaFoodCost.reset();
    setFoodCostForm({
      costo_food_per_persona: "18",
      costo_bevande_per_persona: "5",
      costo_extra_fisso: "0",
      percentuale_target: "30",
    });
    setErrore("");
    setDrawerAperto(true);
  };

  const toggleExtra = (value: NonNullable<PreventivoPricingInput["extra"]>[number], checked: boolean) => {
    setPricingForm((current) => ({
      ...current,
      extra: checked
        ? Array.from(new Set([...current.extra, value]))
        : current.extra.filter((item) => item !== value),
    }));
  };

  const applicaCalcoloPrezzo = async () => {
    const numeroInvitati = Number.parseInt(form.numero_invitati, 10);
    if (!numeroInvitati || numeroInvitati <= 0) {
      setErrore("Inserisci il numero invitati prima di calcolare il prezzo.");
      return;
    }

    try {
      const result = await calcolaPrezzo.mutateAsync({
        data: {
          pacchetto: pricingForm.pacchetto,
          numero_invitati: numeroInvitati,
          extra: pricingForm.extra,
        },
      });
      setForm((current) => ({ ...current, budget_stimato: result.totale.toString() }));
      setErrore("");
    } catch {
      setErrore("Errore durante il calcolo del prezzo.");
    }
  };

  const applicaFoodCost = async () => {
    const numeroInvitati = Number.parseInt(form.numero_invitati, 10);
    if (!numeroInvitati || numeroInvitati <= 0) {
      setErrore("Inserisci il numero invitati prima di calcolare il food cost.");
      return;
    }

    try {
      await calcolaFoodCost.mutateAsync({
        data: {
          numero_invitati: numeroInvitati,
          budget_previsto: form.budget_stimato ? parseNumberField(form.budget_stimato) : undefined,
          costo_food_per_persona: parseNumberField(foodCostForm.costo_food_per_persona),
          costo_bevande_per_persona: parseNumberField(foodCostForm.costo_bevande_per_persona),
          costo_extra_fisso: parseNumberField(foodCostForm.costo_extra_fisso),
          percentuale_target: parseNumberField(foodCostForm.percentuale_target, 30),
        },
      });
      setErrore("");
    } catch {
      setErrore("Errore durante il calcolo del food cost.");
    }
  };

  const applicaPrezzoTarget = (result: PreventivoFoodCostResult) => {
    setForm((current) => ({
      ...current,
      budget_stimato: result.prezzo_minimo_target.toFixed(2),
    }));
  };

  const salva = async () => {
    if (!form.contatto_id) { setErrore("Seleziona un contatto."); return; }
    const payload = {
      contatto_id: form.contatto_id,
      data_evento_richiesta: form.data_evento_richiesta || undefined,
      numero_invitati: form.numero_invitati ? parseInt(form.numero_invitati) : undefined,
      budget_stimato: form.budget_stimato ? parseFloat(form.budget_stimato) : undefined,
      note: form.note || undefined,
      stato_evento: form.stato_evento,
    };
    try {
      if (selezionato) {
        await aggiorna.mutateAsync({ id: selezionato.id, data: payload });
      } else {
        await crea.mutateAsync({ data: payload });
      }
      await invalida();
      setDrawerAperto(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Data non disponibile")) {
        setErrore("La data selezionata e gia occupata da un evento confermato.");
        return;
      }
      setErrore("Errore durante il salvataggio.");
    }
  };

  const rimuovi = async (id: string) => {
    if (!confirm("Eliminare questo preventivo?")) return;
    await elimina.mutateAsync({ id });
    await invalida();
  };

  const inviaPreventivoWhatsApp = async (id: string) => {
    try {
      const result = await inviaWhatsApp.mutateAsync({ id });
      alert(result.message);
    } catch {
      alert("Errore durante l'invio del preventivo via WhatsApp.");
    }
  };

  const scaricaPreventivoPdf = (id: string) => {
    window.open(getDownloadPreventivoPdfUrl(id), "_blank", "noopener,noreferrer");
  };

  const confermaDigitale = async (preventivo: Preventivo) => {
    const firmatario = prompt("Nome firmatario conferma:", preventivo.contatto_nome || "");
    if (!firmatario?.trim()) return;
    const note = prompt("Note conferma (opzionale):", "") || undefined;

    try {
      const result = await confermaDigitaleMutation.mutateAsync({
        id: preventivo.id,
        data: {
          firmatario_nome: firmatario.trim(),
          metodo: "conferma_manuale",
          note,
        },
      });
      alert(result.message);
      await invalida();
    } catch {
      alert("Errore durante la conferma digitale del preventivo.");
    }
  };

  const budgetTotale = preventivi
    ?.filter((p) => p.stato_evento === "confermato")
    .reduce((sum, p) => sum + (parseBudget(p.budget_stimato) || 0), 0) ?? 0;

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Preventivi</h1>
            <p className="text-muted-foreground">Gestione preventivi e quote eventi.</p>
          </div>
          <Button onClick={apriNuovo}>
            <Plus className="w-4 h-4 mr-2" /> Nuovo Preventivo
          </Button>
        </div>

        {budgetTotale > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3 inline-flex gap-6">
            <div>
              <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Budget confermato</p>
              <p className="text-2xl font-bold text-green-800">
                {budgetTotale.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Eventi confermati</p>
              <p className="text-2xl font-bold text-green-800">
                {preventivi?.filter((p) => p.stato_evento === "confermato").length}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Select value={filtroStato} onValueChange={setFiltroStato}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tutti gli stati" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="opzionato">Opzionato</SelectItem>
              <SelectItem value="confermato">Confermato</SelectItem>
              <SelectItem value="rifiutato">Rifiutato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Evento</TableHead>
                <TableHead>Invitati</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Note</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-rose-600 font-semibold">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="h-8 w-8 text-rose-500" />
                      <p>Errore durante il caricamento dei preventivi.</p>
                      <Button size="sm" variant="outline" onClick={() => void refetch()} className="mt-2 text-xs border-rose-500/20 text-rose-600 hover:bg-rose-500/5">
                        Riprova
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : preventivi?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                      <p className="font-bold text-foreground">Nessun preventivo trovato</p>
                      <p className="text-xs">Crea un nuovo preventivo per iniziare la trattativa commerciale.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                preventivi?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.contatto_nome || "-"}</TableCell>
                    <TableCell>
                      {p.data_evento_richiesta
                        ? format(new Date(p.data_evento_richiesta), "d MMM yyyy", { locale: it })
                        : "-"}
                    </TableCell>
                    <TableCell>{p.numero_invitati ?? "-"}</TableCell>
                    <TableCell>
                      {p.budget_stimato
                        ? parseBudget(p.budget_stimato).toLocaleString("it-IT", { style: "currency", currency: "EUR" })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statoColore[p.stato_evento] || "bg-muted"}`}>
                        {statoLabel[p.stato_evento] || p.stato_evento}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{p.note || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => apriModifica(p as Preventivo)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => scaricaPreventivoPdf(p.id)}
                          title="Scarica PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => void inviaPreventivoWhatsApp(p.id)}
                          disabled={inviaWhatsApp.isPending}
                          title="Invia preventivo via WhatsApp"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-700"
                          onClick={() => void confermaDigitale(p as Preventivo)}
                          disabled={confermaDigitaleMutation.isPending || p.stato_evento === "confermato"}
                          title="Conferma digitale"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => rimuovi(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={drawerAperto} onOpenChange={setDrawerAperto}>
        <SheetContent className="w-[420px] sm:w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selezionato ? "Modifica Preventivo" : "Nuovo Preventivo"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={form.contatto_id} onValueChange={(v) => setForm((f) => ({ ...f, contatto_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {contatti?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome} — {c.telefono}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data evento</Label>
              <Input
                type="date"
                value={form.data_evento_richiesta}
                onChange={(e) => setForm((f) => ({ ...f, data_evento_richiesta: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Numero invitati</Label>
                <Input
                  type="number"
                  placeholder="es. 80"
                  value={form.numero_invitati}
                  onChange={(e) => setForm((f) => ({ ...f, numero_invitati: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Budget stimato (EUR)</Label>
                <Input
                  type="number"
                  placeholder="es. 4500"
                  value={form.budget_stimato}
                  onChange={(e) => setForm((f) => ({ ...f, budget_stimato: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>Calcolo pacchetto</Label>
                  <p className="text-xs text-muted-foreground">
                    Stima il budget dal listino interno e applicalo al preventivo.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void applicaCalcoloPrezzo()}
                  disabled={calcolaPrezzo.isPending}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  {calcolaPrezzo.isPending ? "Calcolo..." : "Calcola"}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>Pacchetto</Label>
                <Select
                  value={pricingForm.pacchetto}
                  onValueChange={(value) =>
                    setPricingForm((current) => ({
                      ...current,
                      pacchetto: value as PreventivoPricingInput["pacchetto"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essenziale">Essenziale</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {pricingExtras.map((extra) => (
                  <label key={extra.value} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                    <Checkbox
                      checked={pricingForm.extra.includes(extra.value)}
                      onCheckedChange={(checked) => toggleExtra(extra.value, checked === true)}
                    />
                    {extra.label}
                  </label>
                ))}
              </div>
              {calcolaPrezzo.data && (
                <div className="rounded-md bg-background p-3 text-sm">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Totale stimato</span>
                    <span>{calcolaPrezzo.data.totale_formattato}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {calcolaPrezzo.data.voci.map((voce) => (
                      <div key={voce.codice} className="flex justify-between gap-3">
                        <span>{voce.descrizione}</span>
                        <span>{voce.totale.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>Food cost evento</Label>
                  <p className="text-xs text-muted-foreground">
                    Calcola incidenza costi, margine lordo e prezzo minimo in base agli invitati.
                  </p>
                </div>
                <div className="flex gap-2">
                  {calcolaFoodCost.data ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applicaPrezzoTarget(calcolaFoodCost.data)}
                    >
                      Usa prezzo target
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void applicaFoodCost()}
                    disabled={calcolaFoodCost.isPending}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    {calcolaFoodCost.isPending ? "Calcolo..." : "Food cost"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Cibo per persona</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={foodCostForm.costo_food_per_persona}
                    onChange={(e) => setFoodCostForm((current) => ({ ...current, costo_food_per_persona: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bevande per persona</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={foodCostForm.costo_bevande_per_persona}
                    onChange={(e) => setFoodCostForm((current) => ({ ...current, costo_bevande_per_persona: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Extra fissi evento</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={foodCostForm.costo_extra_fisso}
                    onChange={(e) => setFoodCostForm((current) => ({ ...current, costo_extra_fisso: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target food cost %</Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="99.9"
                    step="0.1"
                    value={foodCostForm.percentuale_target}
                    onChange={(e) => setFoodCostForm((current) => ({ ...current, percentuale_target: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Usa "Extra fissi evento" per personale, logistica, trasporti o altri costi non legati al singolo invitato.
              </p>
              {calcolaFoodCost.data && (
                <div className="space-y-3 rounded-md bg-background p-3 text-sm">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="rounded-md border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Costo totale</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(calcolaFoodCost.data.costo_totale)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Costo variabile persona</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(calcolaFoodCost.data.costo_variabile_per_persona)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Prezzo minimo target</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(calcolaFoodCost.data.prezzo_minimo_target)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Incidenza food cost</p>
                      <p className="mt-1 text-lg font-semibold">
                        {typeof calcolaFoodCost.data.food_cost_percentuale === "number"
                          ? `${calcolaFoodCost.data.food_cost_percentuale}%`
                          : "-"}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Margine lordo</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(calcolaFoodCost.data.margine_lordo)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ricavo medio persona</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(calcolaFoodCost.data.ricavo_medio_persona)}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <span>Costo variabile totale</span>
                      <span>{formatCurrency(calcolaFoodCost.data.costo_variabile_totale)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Extra fissi</span>
                      <span>{formatCurrency(calcolaFoodCost.data.costo_extra_fisso)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Margine per persona</span>
                      <span>{formatCurrency(calcolaFoodCost.data.margine_per_persona)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{calcolaFoodCost.data.note}</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Stato</Label>
              <Select value={form.stato_evento} onValueChange={(v) => setForm((f) => ({ ...f, stato_evento: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="opzionato">Opzionato</SelectItem>
                  <SelectItem value="confermato">Confermato</SelectItem>
                  <SelectItem value="rifiutato">Rifiutato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea
                placeholder="Dettagli aggiuntivi..."
                rows={4}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerAperto(false)}>Annulla</Button>
            <Button onClick={salva} disabled={crea.isPending || aggiorna.isPending}>
              {crea.isPending || aggiorna.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </SidebarLayout>
  );
}
