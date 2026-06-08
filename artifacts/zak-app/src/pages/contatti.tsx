import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import { Upload, Plus, Save, Search, StickyNote, User, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getGetContattoQueryKey,
  getGetContattoMessaggiQueryKey,
  getGetContattoStoricoStatoQueryKey,
  getListContattiQueryKey,
  getListPreventiviQueryKey,
  useGetContatto,
  useGetContattoMessaggi,
  useGetContattoStoricoStato,
  useImportContattiCsv,
  useListContatti,
  useListPreventivi,
  useUpdateContatto,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function Contatti() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statoLead, setStatoLead] = useState<string>("all");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [noteInterna, setNoteInterna] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);

  const listParams = {
    search: search || undefined,
    stato_lead: statoLead !== "all" ? statoLead : undefined,
  };

  const { data: contatti, isLoading, isError, refetch } = useListContatti(listParams, {
    query: { queryKey: getListContattiQueryKey(listParams) },
  });
  const { data: contattoDettaglio } = useGetContatto(selectedContactId || "", {
    query: { queryKey: getGetContattoQueryKey(selectedContactId || ""), enabled: !!selectedContactId },
  });
  const { data: messaggiContatto } = useGetContattoMessaggi(selectedContactId || "", {
    query: { queryKey: getGetContattoMessaggiQueryKey(selectedContactId || ""), enabled: !!selectedContactId },
  });
  const { data: storicoStatoContatto } = useGetContattoStoricoStato(selectedContactId || "", {
    query: { queryKey: getGetContattoStoricoStatoQueryKey(selectedContactId || ""), enabled: !!selectedContactId },
  });
  const { data: preventiviContatto } = useListPreventivi(
    { contatto_id: selectedContactId || undefined },
    {
      query: {
        queryKey: getListPreventiviQueryKey({ contatto_id: selectedContactId || undefined }),
        enabled: !!selectedContactId,
      },
    },
  );
  const updateContatto = useUpdateContatto();
  const importContattiCsv = useImportContattiCsv();

  useEffect(() => {
    setNoteInterna(contattoDettaglio?.note_interna || "");
  }, [contattoDettaglio?.id, contattoDettaglio?.note_interna]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "entrata":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "in_trattativa":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "confermato":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "perso":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleSaveNote = () => {
    if (!selectedContactId) {
      return;
    }

    updateContatto.mutate(
      {
        id: selectedContactId,
        data: { note_interna: noteInterna || undefined },
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetContattoQueryKey(selectedContactId) });
          await queryClient.invalidateQueries({ queryKey: getListContattiQueryKey(listParams) });
        },
      },
    );
  };

  const handleImportCsv = async (file: File | undefined) => {
    if (!file) return;
    const csv = await file.text();
    importContattiCsv.mutate(
      { data: { csv } },
      {
        onSuccess: async (result) => {
          setImportResult(`Import CSV: ${result.creati} creati, ${result.saltati} duplicati, ${result.errori.length} errori`);
          await queryClient.invalidateQueries({ queryKey: getListContattiQueryKey(listParams) });
        },
        onError: (error) => {
          setImportResult(`Import CSV fallito: ${error instanceof Error ? error.message : "errore sconosciuto"}`);
        },
      },
    );
  };

  const timelineItems = [
    ...(messaggiContatto ?? []).map((messaggio) => ({
      id: `msg-${messaggio.id}`,
      timestamp: messaggio.timestamp,
      title: messaggio.canale === "voice" ? "Telefonata registrata" : messaggio.direzione === "inbound" ? "Messaggio ricevuto" : "Messaggio inviato",
      description: `${messaggio.canale}: ${messaggio.testo}`,
    })),
    ...(preventiviContatto ?? []).map((preventivo) => ({
      id: `prev-${preventivo.id}`,
      timestamp: preventivo.data_creazione,
      title: "Preventivo aggiornato",
      description: `${preventivo.stato_evento} - ${preventivo.numero_invitati || "n/d"} invitati`,
    })),
    ...(storicoStatoContatto ?? []).map((item) => ({
      id: `stato-${item.id}`,
      timestamp: item.data_cambio,
      title: "Stato lead aggiornato",
      description: `${item.stato_precedente || "nessuno"} -> ${item.stato_successivo} (${item.origine})${item.nota ? ` - ${item.nota}` : ""}`,
    })),
  ].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

  return (
    <SidebarLayout>
      <div className="flex h-full">
        <div className="flex-1 space-y-6 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Contatti</h1>
              <p className="text-muted-foreground">Gestisci i lead, i clienti e le note operative interne.</p>
            </div>
            <Button asChild>
              <Link href="/contatti/nuovo">
                <Plus className="mr-2 h-4 w-4" /> Nuovo Contatto
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o telefono..."
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={statoLead} onValueChange={setStatoLead}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="entrata">In entrata</SelectItem>
                <SelectItem value="in_trattativa">In trattativa</SelectItem>
                <SelectItem value="confermato">Confermato</SelectItem>
                <SelectItem value="perso">Perso</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline" disabled={importContattiCsv.isPending}>
              <label>
                <Upload className="mr-2 h-4 w-4" />
                Importa CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => void handleImportCsv(event.target.files?.[0])}
                />
              </label>
            </Button>
          </div>
          {importResult && <p className="text-sm text-muted-foreground">{importResult}</p>}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Tipo Evento</TableHead>
                  <TableHead>Note Staff</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Creazione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-rose-600 font-semibold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-rose-500" />
                        <p>Errore durante il caricamento dei contatti.</p>
                        <Button size="sm" variant="outline" onClick={() => void refetch()} className="mt-2 text-xs border-rose-500/20 text-rose-600 hover:bg-rose-500/5">
                          Riprova
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contatti?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <User className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-bold text-foreground">Nessun contatto trovato</p>
                        <p className="text-xs">Prova a cambiare i filtri o aggiungi un contatto nuovo.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  contatti?.map((contatto) => (
                    <TableRow
                      key={contatto.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedContactId === contatto.id ? "bg-muted/40" : ""}`}
                      onClick={() => setSelectedContactId(contatto.id)}
                    >
                      <TableCell className="font-medium">{contatto.nome}</TableCell>
                      <TableCell>{contatto.telefono}</TableCell>
                      <TableCell className="capitalize">{contatto.origine_lead}</TableCell>
                      <TableCell className="capitalize">{contatto.tipo_evento?.replace("_", " ") || "-"}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {contatto.note_interna?.trim() || "Nessuna nota"}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(contatto.stato_lead)}`}>
                          {contatto.stato_lead.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(contatto.data_creazione), "d MMM yyyy", { locale: it })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="w-80 border-l bg-card p-6">
          {contattoDettaglio ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">{contattoDettaglio.nome}</h2>
                <p className="text-sm text-muted-foreground">{contattoDettaglio.telefono}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Stato Lead</p>
                  <Badge>{contattoDettaglio.stato_lead}</Badge>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Tipo Evento</p>
                  <p className="text-sm capitalize">{contattoDettaglio.tipo_evento?.replace("_", " ") || "Da definire"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Origine</p>
                  <p className="text-sm capitalize">{contattoDettaglio.origine_lead}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Note interne staff</p>
                </div>
                <Textarea
                  value={noteInterna}
                  onChange={(event) => setNoteInterna(event.target.value)}
                  placeholder="Aggiungi contesto operativo, promemoria o dettagli utili per lo staff..."
                  className="min-h-[220px]"
                />
                <Button
                  className="w-full"
                  onClick={handleSaveNote}
                  disabled={updateContatto.isPending || noteInterna === (contattoDettaglio.note_interna || "")}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salva nota
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Timeline contatto</p>
                <div className="max-h-[260px] space-y-3 overflow-y-auto rounded-md border p-3">
                  {timelineItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessuna attivita registrata per questo contatto.</p>
                  ) : (
                    timelineItems.map((item) => (
                      <div key={item.id} className="border-b pb-3 last:border-0 last:pb-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: it })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Seleziona un contatto per leggere o aggiornare le note interne dello staff.
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
