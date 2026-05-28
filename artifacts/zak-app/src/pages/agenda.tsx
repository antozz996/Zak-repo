import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListAgenda,
  useCreateAgendaItem,
  useUpdateAgendaItem,
  useDeleteAgendaItem,
  getListAgendaQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, List, CalendarDays } from "lucide-react";

type AgendaItem = {
  id: string;
  titolo: string;
  descrizione?: string | null;
  data_ora_inizio: string;
  data_ora_fine: string;
  categoria: string;
  promemoria_inviato: boolean;
};

const categoriaColore: Record<string, string> = {
  lavoro: "bg-blue-100 text-blue-800 border-blue-200",
  personale: "bg-purple-100 text-purple-800 border-purple-200",
};

const vuoto = {
  titolo: "",
  descrizione: "",
  data_ora_inizio: "",
  data_ora_fine: "",
  categoria: "lavoro",
};

export default function Agenda() {
  const qc = useQueryClient();
  const [vista, setVista] = useState<"lista" | "calendario">("lista");
  const [meseCorrente, setMeseCorrente] = useState(new Date());
  const [drawerAperto, setDrawerAperto] = useState(false);
  const [selezionato, setSelezionato] = useState<AgendaItem | null>(null);
  const [form, setForm] = useState(vuoto);
  const [errore, setErrore] = useState("");
  const [filtraCategoria, setFiltraCategoria] = useState("all");

  const { data: items, isLoading } = useListAgenda({
    categoria: filtraCategoria !== "all" ? filtraCategoria : undefined,
  });

  const crea = useCreateAgendaItem();
  const aggiorna = useUpdateAgendaItem();
  const elimina = useDeleteAgendaItem();

  const invalida = () => qc.invalidateQueries({ queryKey: getListAgendaQueryKey() });

  const apriNuovo = (dataInizio?: string) => {
    setSelezionato(null);
    setForm({ ...vuoto, data_ora_inizio: dataInizio || "", data_ora_fine: dataInizio || "" });
    setErrore("");
    setDrawerAperto(true);
  };

  const apriModifica = (item: AgendaItem) => {
    setSelezionato(item);
    setForm({
      titolo: item.titolo,
      descrizione: item.descrizione || "",
      data_ora_inizio: item.data_ora_inizio.slice(0, 16),
      data_ora_fine: item.data_ora_fine.slice(0, 16),
      categoria: item.categoria,
    });
    setErrore("");
    setDrawerAperto(true);
  };

  const salva = async () => {
    if (!form.titolo.trim()) { setErrore("Il titolo è obbligatorio."); return; }
    if (!form.data_ora_inizio || !form.data_ora_fine) { setErrore("Inserisci data e ora di inizio e fine."); return; }
    const payload = {
      titolo: form.titolo,
      descrizione: form.descrizione || undefined,
      data_ora_inizio: new Date(form.data_ora_inizio).toISOString(),
      data_ora_fine: new Date(form.data_ora_fine).toISOString(),
      categoria: form.categoria,
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
    if (!confirm("Eliminare questo impegno?")) return;
    await elimina.mutateAsync({ id });
    await invalida();
  };

  // Calendar helpers
  const calStart = startOfWeek(startOfMonth(meseCorrente), { locale: it });
  const calEnd = endOfWeek(endOfMonth(meseCorrente), { locale: it });
  const giorniCalendario = eachDayOfInterval({ start: calStart, end: calEnd });
  const giorniSettimana = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  const eventiPerGiorno = (giorno: Date) =>
    (items || []).filter((item) => isSameDay(new Date(item.data_ora_inizio), giorno));

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Impegni personali e lavorativi di Salvatore.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setVista("lista")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${vista === "lista" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
              >
                <List className="w-4 h-4" /> Lista
              </button>
              <button
                onClick={() => setVista("calendario")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${vista === "calendario" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
              >
                <CalendarDays className="w-4 h-4" /> Calendario
              </button>
            </div>
            <Button onClick={() => apriNuovo()}>
              <Plus className="w-4 h-4 mr-2" /> Nuovo Impegno
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Select value={filtraCategoria} onValueChange={setFiltraCategoria}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tutte le categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              <SelectItem value="lavoro">Lavoro</SelectItem>
              <SelectItem value="personale">Personale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {vista === "lista" ? (
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Caricamento...</p>
            ) : items?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nessun impegno trovato.</p>
            ) : (
              items?.map((item) => (
                <div key={item.id} className={`border rounded-lg p-4 flex items-start justify-between gap-4 ${categoriaColore[item.categoria] || "bg-muted"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{item.titolo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${categoriaColore[item.categoria]}`}>
                        {item.categoria}
                      </span>
                    </div>
                    {item.descrizione && (
                      <p className="text-sm opacity-80 mb-1 truncate">{item.descrizione}</p>
                    )}
                    <p className="text-xs opacity-70">
                      {format(new Date(item.data_ora_inizio), "d MMM yyyy, HH:mm", { locale: it })}
                      {" — "}
                      {format(new Date(item.data_ora_fine), "HH:mm", { locale: it })}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => apriModifica(item as AgendaItem)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => rimuovi(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-background">
            <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
              <button onClick={() => setMeseCorrente(subMonths(meseCorrente, 1))} className="p-1 hover:bg-muted rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold capitalize">
                {format(meseCorrente, "MMMM yyyy", { locale: it })}
              </span>
              <button onClick={() => setMeseCorrente(addMonths(meseCorrente, 1))} className="p-1 hover:bg-muted rounded">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 border-b">
              {giorniSettimana.map((g) => (
                <div key={g} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0">
                  {g}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {giorniCalendario.map((giorno, i) => {
                const eventi = eventiPerGiorno(giorno);
                const corrente = isSameMonth(giorno, meseCorrente);
                const oggi = isToday(giorno);
                return (
                  <div
                    key={i}
                    className={`min-h-[90px] border-r border-b last:border-r-0 p-1.5 cursor-pointer hover:bg-muted/30 transition-colors ${!corrente ? "bg-muted/10" : ""}`}
                    onClick={() => apriNuovo(format(giorno, "yyyy-MM-dd") + "T09:00")}
                  >
                    <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${oggi ? "bg-primary text-primary-foreground" : corrente ? "text-foreground" : "text-muted-foreground"}`}>
                      {format(giorno, "d")}
                    </span>
                    <div className="space-y-0.5">
                      {eventi.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); apriModifica(ev as AgendaItem); }}
                          className={`text-xs px-1.5 py-0.5 rounded truncate border ${categoriaColore[ev.categoria] || "bg-muted"} cursor-pointer`}
                        >
                          {ev.titolo}
                        </div>
                      ))}
                      {eventi.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-1">+{eventi.length - 3} altri</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Sheet open={drawerAperto} onOpenChange={setDrawerAperto}>
        <SheetContent className="w-[420px] sm:w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selezionato ? "Modifica Impegno" : "Nuovo Impegno"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5">
              <Label>Titolo</Label>
              <Input
                placeholder="es. Riunione staff"
                value={form.titolo}
                onChange={(e) => setForm((f) => ({ ...f, titolo: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Inizio</Label>
                <Input
                  type="datetime-local"
                  value={form.data_ora_inizio}
                  onChange={(e) => setForm((f) => ({ ...f, data_ora_inizio: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fine</Label>
                <Input
                  type="datetime-local"
                  value={form.data_ora_fine}
                  onChange={(e) => setForm((f) => ({ ...f, data_ora_fine: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lavoro">Lavoro</SelectItem>
                  <SelectItem value="personale">Personale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea
                placeholder="Dettagli aggiuntivi..."
                rows={4}
                value={form.descrizione}
                onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))}
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
