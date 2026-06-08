import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CheckCircle2, Clock, Plus, RotateCcw, Trash2, User, AlertCircle, CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getListTaskPersonaliQueryKey,
  useCreateTaskPersonale,
  useDeleteTaskPersonale,
  useListTaskPersonali,
  useUpdateTaskPersonale,
  type TaskPersonale,
} from "@workspace/api-client-react";

const formIniziale = {
  titolo: "",
  descrizione: "",
  priorita: "media",
  scadenza: "",
};

const prioritaBadge: Record<string, string> = {
  bassa: "bg-slate-100 text-slate-700 border-slate-200",
  media: "bg-blue-100 text-blue-700 border-blue-200",
  alta: "bg-orange-100 text-orange-700 border-orange-200",
  urgente: "bg-red-100 text-red-700 border-red-200",
};

function formattaData(valore?: string | null) {
  if (!valore) return null;
  return format(new Date(valore), "d MMM yyyy, HH:mm", { locale: it });
}

export default function Task() {
  const qc = useQueryClient();
  const [filtroStato, setFiltroStato] = useState("aperto");
  const [filtroPriorita, setFiltroPriorita] = useState("all");
  const [form, setForm] = useState(formIniziale);
  const [errore, setErrore] = useState("");

  const params = {
    stato: filtroStato !== "all" ? filtroStato : undefined,
    priorita: filtroPriorita !== "all" ? filtroPriorita : undefined,
  };

  const { data: task = [], isLoading, isError } = useListTaskPersonali(params);
  const crea = useCreateTaskPersonale();
  const aggiorna = useUpdateTaskPersonale();
  const elimina = useDeleteTaskPersonale();

  const invalida = () => qc.invalidateQueries({ queryKey: getListTaskPersonaliQueryKey() });

  const salva = async () => {
    if (!form.titolo.trim()) {
      setErrore("Il titolo e obbligatorio.");
      return;
    }

    setErrore("");
    await crea.mutateAsync({
      data: {
        titolo: form.titolo.trim(),
        descrizione: form.descrizione.trim() || undefined,
        priorita: form.priorita,
        scadenza: form.scadenza ? new Date(form.scadenza).toISOString() : undefined,
        fonte: "manuale",
      },
    });
    setForm(formIniziale);
    await invalida();
  };

  const cambiaStato = async (item: TaskPersonale) => {
    const completato = item.stato === "completato";
    await aggiorna.mutateAsync({
      id: item.id,
      data: { stato: completato ? "aperto" : "completato" },
    });
    await invalida();
  };

  const rimuovi = async (id: string) => {
    if (!confirm("Eliminare questo task personale?")) return;
    await elimina.mutateAsync({ id });
    await invalida();
  };

  const aperti = task.filter((item) => item.stato !== "completato").length;
  const completati = task.filter((item) => item.stato === "completato").length;

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task personali</h1>
            <p className="text-muted-foreground">
              Promemoria e cose da fare separati dagli eventi in agenda.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Aperti</p>
                <p className="text-2xl font-bold">{aperti}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Completati</p>
                <p className="text-2xl font-bold">{completati}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuovo task
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_1fr_180px_180px_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="task-titolo">Titolo</Label>
              <Input
                id="task-titolo"
                value={form.titolo}
                onChange={(event) => setForm((prev) => ({ ...prev, titolo: event.target.value }))}
                placeholder="Es. richiamare cliente laurea"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-descrizione">Note</Label>
              <Textarea
                id="task-descrizione"
                className="min-h-10"
                value={form.descrizione}
                onChange={(event) => setForm((prev) => ({ ...prev, descrizione: event.target.value }))}
                placeholder="Dettagli rapidi"
              />
            </div>
            <div className="space-y-2">
              <Label>Priorita</Label>
              <Select value={form.priorita} onValueChange={(value) => setForm((prev) => ({ ...prev, priorita: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">Bassa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-scadenza">Scadenza</Label>
              <Input
                id="task-scadenza"
                type="datetime-local"
                value={form.scadenza}
                onChange={(event) => setForm((prev) => ({ ...prev, scadenza: event.target.value }))}
              />
            </div>
            <Button onClick={salva} disabled={crea.isPending}>
              {crea.isPending ? "Salvataggio..." : "Aggiungi"}
            </Button>
            {errore ? <p className="text-sm text-destructive lg:col-span-5">{errore}</p> : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 md:flex-row">
          <Select value={filtroStato} onValueChange={setFiltroStato}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="aperto">Aperti</SelectItem>
              <SelectItem value="completato">Completati</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPriorita} onValueChange={setFiltroPriorita}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Priorita" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le priorita</SelectItem>
              <SelectItem value="bassa">Bassa</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {isError ? (
          <Card className="border-rose-500/20 bg-rose-500/[0.01]">
            <CardContent className="p-8 text-center text-rose-600 font-semibold flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p>Errore durante il caricamento dei task personali.</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && task.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
              <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
              <p className="font-bold text-foreground">Nessun task trovato</p>
              <p className="text-xs">Crea un nuovo task sopra per organizzare le tue attivita' dello staff.</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-3">
          {task.map((item) => {
            const completato = item.stato === "completato";
            const scadenza = formattaData(item.scadenza);
            return (
              <Card key={item.id} className={completato ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className={`text-lg font-semibold ${completato ? "line-through" : ""}`}>{item.titolo}</h2>
                        <Badge variant="outline" className={prioritaBadge[item.priorita] || prioritaBadge.media}>
                          {item.priorita}
                        </Badge>
                        <Badge variant={completato ? "secondary" : "default"}>{item.stato}</Badge>
                      </div>
                      {item.descrizione ? <p className="text-sm text-muted-foreground">{item.descrizione}</p> : null}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {scadenza ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {scadenza}
                          </span>
                        ) : null}
                        {item.contatto_nome ? (
                          <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            {item.contatto_nome}
                          </span>
                        ) : null}
                        <span>Fonte: {item.fonte}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => cambiaStato(item)} disabled={aggiorna.isPending}>
                        {completato ? <RotateCcw className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {completato ? "Riapri" : "Completa"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => rimuovi(item.id)} disabled={elimina.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SidebarLayout>
  );
}
