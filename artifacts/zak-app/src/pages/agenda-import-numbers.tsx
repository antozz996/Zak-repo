import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAgendaQueryKey,
  useImportAgendaNumbersCsv,
  type ImportAgendaNumbersCsvResult,
} from "@workspace/api-client-react";
import { ArrowLeft, CalendarDays, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Link } from "wouter";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const monthOptions = [
  { value: "auto", label: "Dal file CSV" },
  { value: "1", label: "Gennaio" },
  { value: "2", label: "Febbraio" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Aprile" },
  { value: "5", label: "Maggio" },
  { value: "6", label: "Giugno" },
  { value: "7", label: "Luglio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Settembre" },
  { value: "10", label: "Ottobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Dicembre" },
];

export default function AgendaImportNumbers() {
  const queryClient = useQueryClient();
  const importNumbers = useImportAgendaNumbersCsv();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [defaultMonth, setDefaultMonth] = useState("auto");
  const [pStart, setPStart] = useState("13:00");
  const [pEnd, setPEnd] = useState("17:00");
  const [cStart, setCStart] = useState("20:00");
  const [cEnd, setCEnd] = useState("23:59");
  const [preview, setPreview] = useState<ImportAgendaNumbersCsvResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runImport = async (dryRun: boolean) => {
    if (!csv.trim()) {
      setMessage("Carica prima un CSV esportato da Apple Numbers.");
      return;
    }

    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      setMessage("L'anno deve essere compreso tra 2000 e 2100.");
      return;
    }

    const result = await importNumbers.mutateAsync({
      data: {
        csv,
        year: parsedYear,
        default_month: defaultMonth === "auto" ? undefined : Number(defaultMonth),
        categoria: "lavoro",
        p_slot_label: "P",
        p_start_time: pStart,
        p_end_time: pEnd,
        c_slot_label: "C",
        c_start_time: cStart,
        c_end_time: cEnd,
        dry_run: dryRun,
      },
    });

    setPreview(result);
    if (dryRun) {
      setMessage(`Preview pronta: ${result.trovati} eventi letti, ${result.saltati} gia presenti, ${result.errori.length} errori.`);
      return;
    }

    setMessage(`Import completato: ${result.creati} creati, ${result.saltati} saltati, ${result.errori.length} errori.`);
    await queryClient.invalidateQueries({ queryKey: getListAgendaQueryKey() });
  };

  const duplicateCount = preview?.items.filter((item) => item.gia_presente).length ?? 0;

  return (
    <SidebarLayout>
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 -ml-3">
              <Link href="/agenda">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Torna ad Agenda
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Importa da Apple Numbers</h1>
            </div>
            <p className="text-muted-foreground">
              Carica il CSV esportato da Numbers nel formato mensile con righe `P` e `C`, preview prima dell'import e deduplica su agenda gia presente.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border bg-background px-4 py-3">
              <p className="text-2xl font-bold">{preview?.trovati ?? 0}</p>
              <p className="text-xs text-muted-foreground">Eventi letti</p>
            </div>
            <div className="rounded-md border bg-background px-4 py-3">
              <p className="text-2xl font-bold">{duplicateCount}</p>
              <p className="text-xs text-muted-foreground">Gia presenti</p>
            </div>
            <div className="rounded-md border bg-background px-4 py-3">
              <p className="text-2xl font-bold">{preview?.errori.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Errori</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. File CSV</CardTitle>
                <CardDescription>Esporta da Apple Numbers in CSV e carica il file qui.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild variant="outline" className="w-full">
                  <label>
                    <Upload className="mr-2 h-4 w-4" />
                    {fileName || "Seleziona CSV"}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setFileName(file.name);
                        setCsv(await file.text());
                        setPreview(null);
                        setMessage(null);
                      }}
                    />
                  </label>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Il formato atteso e` quello del planning mensile con colonna giorno, riga `P`/`C`, descrizione evento e accconto `SI/NO`.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Parametri import</CardTitle>
                <CardDescription>Impostazioni divise per sezione, senza dover toccare il codice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Anno</Label>
                    <Input value={year} onChange={(event) => setYear(event.target.value)} inputMode="numeric" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mese fallback</Label>
                    <Select value={defaultMonth} onValueChange={setDefaultMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Orario slot P - inizio</Label>
                    <Input value={pStart} onChange={(event) => setPStart(event.target.value)} placeholder="13:00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Orario slot P - fine</Label>
                    <Input value={pEnd} onChange={(event) => setPEnd(event.target.value)} placeholder="17:00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Orario slot C - inizio</Label>
                    <Input value={cStart} onChange={(event) => setCStart(event.target.value)} placeholder="20:00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Orario slot C - fine</Label>
                    <Input value={cEnd} onChange={(event) => setCEnd(event.target.value)} placeholder="23:59" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void runImport(true)} disabled={importNumbers.isPending || !csv.trim()}>
                    {importNumbers.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarDays className="mr-2 h-4 w-4" />}
                    Genera preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void runImport(false)}
                    disabled={importNumbers.isPending || !preview || preview.trovati === 0}
                  >
                    {importNumbers.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Importa in agenda
                  </Button>
                </div>

                {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>3. Preview import</CardTitle>
              <CardDescription>Controlla date, slot, stato acconto e duplicati prima di creare eventi reali.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!preview ? (
                <p className="text-sm text-muted-foreground">Nessuna preview disponibile.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{preview.trovati} eventi letti</Badge>
                    <Badge variant="outline">{preview.creati} creati nell'ultima esecuzione</Badge>
                    <Badge variant="outline">{preview.saltati} saltati</Badge>
                  </div>

                  {preview.errori.length > 0 ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      {preview.errori.slice(0, 5).map((error) => `Riga ${error.riga}: ${error.motivo}`).join(" | ")}
                    </div>
                  ) : null}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Slot</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Acconto</TableHead>
                        <TableHead>Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nessun evento trovato nel CSV.
                          </TableCell>
                        </TableRow>
                      ) : (
                        preview.items.slice(0, 80).map((item) => (
                          <TableRow key={`${item.riga}-${item.data_ora_inizio}-${item.titolo}`}>
                            <TableCell>{item.data}</TableCell>
                            <TableCell>{item.slot}</TableCell>
                            <TableCell className="max-w-[260px] truncate">{item.titolo}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.acconto_stato}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.gia_presente ? "outline" : "secondary"}>
                                {item.gia_presente ? "Gia presente" : "Nuovo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
