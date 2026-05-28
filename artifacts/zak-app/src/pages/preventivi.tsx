import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListPreventivi,
  useListContatti,
  useCreatePreventivo,
  useUpdatePreventivo,
  useDeletePreventivo,
  getListPreventiviQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

const parseBudget = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return 0;
  return typeof value === "number" ? value : parseFloat(value);
};

export default function Preventivi() {
  const qc = useQueryClient();
  const [filtroStato, setFiltroStato] = useState("all");
  const [drawerAperto, setDrawerAperto] = useState(false);
  const [selezionato, setSelezionato] = useState<Preventivo | null>(null);
  const [form, setForm] = useState(vuoto);
  const [errore, setErrore] = useState("");

  const { data: preventivi, isLoading } = useListPreventivi({
    stato_evento: filtroStato !== "all" ? filtroStato : undefined,
  });

  const { data: contatti } = useListContatti();

  const crea = useCreatePreventivo();
  const aggiorna = useUpdatePreventivo();
  const elimina = useDeletePreventivo();

  const invalida = () => qc.invalidateQueries({ queryKey: getListPreventiviQueryKey() });

  const apriNuovo = () => {
    setSelezionato(null);
    setForm(vuoto);
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
    setErrore("");
    setDrawerAperto(true);
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
    } catch {
      setErrore("Errore durante il salvataggio.");
    }
  };

  const rimuovi = async (id: string) => {
    if (!confirm("Eliminare questo preventivo?")) return;
    await elimina.mutateAsync({ id });
    await invalida();
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
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Caricamento...</TableCell>
                </TableRow>
              ) : preventivi?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Nessun preventivo trovato.</TableCell>
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
