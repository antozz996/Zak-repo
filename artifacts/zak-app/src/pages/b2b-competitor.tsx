import { useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Briefcase,
  FileDown,
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  getListB2BCompetitorQueryKey,
  getListB2BMaterialiQueryKey,
  getListB2BTemplateQueryKey,
  useAnalyzeB2BCompetitor,
  useCreateB2BCompetitor,
  useCreateB2BMateriale,
  useCreateB2BTemplate,
  useDeleteB2BCompetitor,
  useDeleteB2BMateriale,
  useDeleteB2BTemplate,
  useExportB2BPitch,
  useListB2BCompetitor,
  useListB2BMateriali,
  useListB2BTemplate,
  type B2BCompetitor,
  type B2BCompetitorAnalysisResult,
  type B2BExportResult,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type AnalysisFocus = "generale" | "prezzo" | "proposta" | "debolezze";
type ExportFormat = "pdf" | "presentazione";

const emptyCompetitor = {
  nome: "",
  categoria: "location_eventi",
  citta: "",
  zona: "",
  target: "",
  prezzo_medio: "",
  rating: "",
  sito: "",
  instagram: "",
  punti_forza: "",
  punti_deboli: "",
  note: "",
};

const emptyMaterial = {
  competitor_id: "none",
  nome_file: "",
  tipo_materiale: "brochure",
  url: "",
  stato: "caricato",
  note: "",
};

const emptyTemplate = {
  titolo: "",
  target_tipo: "azienda",
  target_descrizione: "",
  messaggio: "",
  vantaggi: "",
  cta: "",
};

const categoryLabel: Record<string, string> = {
  location_eventi: "Location eventi",
  ristorante: "Ristorante",
  hotel: "Hotel",
  club: "Club",
  agenzia: "Agenzia",
};

function optionalText(value: string) {
  const cleaned = value.trim();
  return cleaned ? cleaned : undefined;
}

function optionalInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return format(new Date(value), "d MMM yyyy", { locale: it });
}

function splitLines(value?: string | null) {
  return (value ?? "")
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function downloadTextFile(result: B2BExportResult) {
  const blob = new Blob([result.contenuto], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.download_filename || "pitch-b2b-zak.txt";
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export default function B2BCompetitor() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [competitorForm, setCompetitorForm] = useState(emptyCompetitor);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [analysisCompetitorId, setAnalysisCompetitorId] = useState("none");
  const [analysisFocus, setAnalysisFocus] = useState<AnalysisFocus>("generale");
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [analysisResult, setAnalysisResult] = useState<B2BCompetitorAnalysisResult | null>(null);
  const [pitchTitle, setPitchTitle] = useState("Proposta B2B Zak");
  const [pitchTarget, setPitchTarget] = useState("Azienda partner");
  const [pitchMessage, setPitchMessage] = useState("");
  const [pitchBudget, setPitchBudget] = useState("");
  const [pitchFormat, setPitchFormat] = useState<ExportFormat>("pdf");
  const [exportResult, setExportResult] = useState<B2BExportResult | null>(null);

  const competitorParams = useMemo(() => ({ search: optionalText(search) }), [search]);
  const { data: competitors = [], isLoading: competitorsLoading } = useListB2BCompetitor(competitorParams);
  const { data: materials = [], isLoading: materialsLoading } = useListB2BMateriali();
  const { data: templates = [], isLoading: templatesLoading } = useListB2BTemplate();

  const createCompetitor = useCreateB2BCompetitor();
  const deleteCompetitor = useDeleteB2BCompetitor();
  const createMaterial = useCreateB2BMateriale();
  const deleteMaterial = useDeleteB2BMateriale();
  const createTemplate = useCreateB2BTemplate();
  const deleteTemplate = useDeleteB2BTemplate();
  const analyzeCompetitor = useAnalyzeB2BCompetitor();
  const exportPitch = useExportB2BPitch();

  const selectedAnalysisCompetitor = competitors.find((item) => item.id === analysisCompetitorId);

  const refreshCompetitors = () =>
    queryClient.invalidateQueries({ queryKey: getListB2BCompetitorQueryKey(competitorParams) });
  const refreshMaterials = () =>
    queryClient.invalidateQueries({ queryKey: getListB2BMaterialiQueryKey() });
  const refreshTemplates = () =>
    queryClient.invalidateQueries({ queryKey: getListB2BTemplateQueryKey() });

  const addCompetitor = async () => {
    if (!competitorForm.nome.trim()) return;
    await createCompetitor.mutateAsync({
      data: {
        nome: competitorForm.nome.trim(),
        categoria: competitorForm.categoria,
        citta: optionalText(competitorForm.citta),
        zona: optionalText(competitorForm.zona),
        target: optionalText(competitorForm.target),
        prezzo_medio: optionalInteger(competitorForm.prezzo_medio),
        rating: optionalInteger(competitorForm.rating),
        sito: optionalText(competitorForm.sito),
        instagram: optionalText(competitorForm.instagram),
        punti_forza: optionalText(competitorForm.punti_forza),
        punti_deboli: optionalText(competitorForm.punti_deboli),
        note: optionalText(competitorForm.note),
      },
    });
    setCompetitorForm(emptyCompetitor);
    await refreshCompetitors();
  };

  const removeCompetitor = async (id: string) => {
    if (!window.confirm("Eliminare questo competitor?")) return;
    await deleteCompetitor.mutateAsync({ id });
    await refreshCompetitors();
  };

  const addMaterial = async () => {
    if (!materialForm.nome_file.trim()) return;
    await createMaterial.mutateAsync({
      data: {
        nome_file: materialForm.nome_file.trim(),
        competitor_id: materialForm.competitor_id === "none" ? undefined : materialForm.competitor_id,
        tipo_materiale: materialForm.tipo_materiale,
        url: optionalText(materialForm.url),
        stato: materialForm.stato,
        note: optionalText(materialForm.note),
      },
    });
    setMaterialForm(emptyMaterial);
    await refreshMaterials();
  };

  const removeMaterial = async (id: string) => {
    if (!window.confirm("Eliminare questo materiale?")) return;
    await deleteMaterial.mutateAsync({ id });
    await refreshMaterials();
  };

  const addTemplate = async () => {
    if (!templateForm.titolo.trim() || !templateForm.messaggio.trim()) return;
    await createTemplate.mutateAsync({
      data: {
        titolo: templateForm.titolo.trim(),
        target_tipo: templateForm.target_tipo,
        target_descrizione: optionalText(templateForm.target_descrizione),
        messaggio: templateForm.messaggio.trim(),
        vantaggi: optionalText(templateForm.vantaggi),
        cta: optionalText(templateForm.cta),
      },
    });
    setTemplateForm(emptyTemplate);
    await refreshTemplates();
  };

  const removeTemplate = async (id: string) => {
    if (!window.confirm("Eliminare questo template?")) return;
    await deleteTemplate.mutateAsync({ id });
    await refreshTemplates();
  };

  const runAnalysis = async () => {
    const prompt = analysisPrompt.trim() || "Analizza posizionamento, debolezze commerciali e opportunita di proposta per Zak.";
    const result = await analyzeCompetitor.mutateAsync({
      data: {
        competitor_id: analysisCompetitorId === "none" ? undefined : analysisCompetitorId,
        focus: analysisFocus,
        prompt,
      },
    });
    setAnalysisResult(result);
  };

  const runExport = async () => {
    if (!pitchTitle.trim() || !pitchTarget.trim()) return;
    const result = await exportPitch.mutateAsync({
      data: {
        titolo: pitchTitle.trim(),
        target: pitchTarget.trim(),
        messaggio: optionalText(pitchMessage),
        budget: optionalInteger(pitchBudget),
        formato: pitchFormat,
      },
    });
    setExportResult(result);
  };

  const renderCompetitorSummary = (competitor: B2BCompetitor) => {
    const strengths = splitLines(competitor.punti_forza);
    const weaknesses = splitLines(competitor.punti_deboli);
    return (
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>{competitor.target || "Target non definito"}</p>
        {strengths.length > 0 && <p>Punti forza: {strengths.join(", ")}</p>}
        {weaknesses.length > 0 && <p>Punti deboli: {weaknesses.join(", ")}</p>}
      </div>
    );
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">B2B</h1>
            </div>
            <p className="text-muted-foreground">Archivio competitor, materiali, template commerciali e pitch partner.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border bg-background px-4 py-3">
              <p className="text-2xl font-bold">{competitors.length}</p>
              <p className="text-xs text-muted-foreground">Competitor</p>
            </div>
            <div className="rounded-md border bg-background px-4 py-3">
              <p className="text-2xl font-bold">{materials.length}</p>
              <p className="text-xs text-muted-foreground">Materiali</p>
            </div>
            <div className="rounded-md border bg-background px-4 py-3">
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-xs text-muted-foreground">Template</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="competitor" className="space-y-6">
          <TabsList>
            <TabsTrigger value="competitor">Competitor</TabsTrigger>
            <TabsTrigger value="materiali">Materiali</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="analisi">Analisi e pitch</TabsTrigger>
          </TabsList>

          <TabsContent value="competitor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nuovo competitor</CardTitle>
                <CardDescription>Registra location, fornitori o partner concorrenti con note utili al team commerciale.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={competitorForm.nome} onChange={(event) => setCompetitorForm((current) => ({ ...current, nome: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={competitorForm.categoria} onValueChange={(value) => setCompetitorForm((current) => ({ ...current, categoria: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Citta</Label>
                  <Input value={competitorForm.citta} onChange={(event) => setCompetitorForm((current) => ({ ...current, citta: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Zona</Label>
                  <Input value={competitorForm.zona} onChange={(event) => setCompetitorForm((current) => ({ ...current, zona: event.target.value }))} />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Target</Label>
                  <Input value={competitorForm.target} onChange={(event) => setCompetitorForm((current) => ({ ...current, target: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prezzo medio</Label>
                  <Input inputMode="numeric" value={competitorForm.prezzo_medio} onChange={(event) => setCompetitorForm((current) => ({ ...current, prezzo_medio: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rating</Label>
                  <Input inputMode="numeric" value={competitorForm.rating} onChange={(event) => setCompetitorForm((current) => ({ ...current, rating: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sito</Label>
                  <Input value={competitorForm.sito} onChange={(event) => setCompetitorForm((current) => ({ ...current, sito: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Instagram</Label>
                  <Input value={competitorForm.instagram} onChange={(event) => setCompetitorForm((current) => ({ ...current, instagram: event.target.value }))} />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Punti forza</Label>
                  <Textarea value={competitorForm.punti_forza} onChange={(event) => setCompetitorForm((current) => ({ ...current, punti_forza: event.target.value }))} />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Punti deboli</Label>
                  <Textarea value={competitorForm.punti_deboli} onChange={(event) => setCompetitorForm((current) => ({ ...current, punti_deboli: event.target.value }))} />
                </div>
                <div className="space-y-1.5 lg:col-span-4">
                  <Label>Note</Label>
                  <Textarea value={competitorForm.note} onChange={(event) => setCompetitorForm((current) => ({ ...current, note: event.target.value }))} />
                </div>
                <div className="lg:col-span-4">
                  <Button onClick={addCompetitor} disabled={createCompetitor.isPending || !competitorForm.nome.trim()}>
                    {createCompetitor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Aggiungi competitor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Archivio competitor</CardTitle>
                    <CardDescription>Lista reale salvata nel CRM.</CardDescription>
                  </div>
                  <div className="relative md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cerca competitor" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {competitorsLoading ? (
                  <p className="text-sm text-muted-foreground">Caricamento competitor...</p>
                ) : competitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun competitor registrato.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Prezzo</TableHead>
                        <TableHead>Note commerciali</TableHead>
                        <TableHead>Aggiornato</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitors.map((competitor) => (
                        <TableRow key={competitor.id}>
                          <TableCell>
                            <p className="font-medium">{competitor.nome}</p>
                            <p className="text-xs text-muted-foreground">{[competitor.citta, competitor.zona].filter(Boolean).join(" - ") || "-"}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{categoryLabel[competitor.categoria] || competitor.categoria}</Badge>
                          </TableCell>
                          <TableCell>{competitor.prezzo_medio ? `EUR ${competitor.prezzo_medio}` : "-"}</TableCell>
                          <TableCell>{renderCompetitorSummary(competitor)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(competitor.data_aggiornamento)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeCompetitor(competitor.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materiali" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registra materiale</CardTitle>
                <CardDescription>Salva link e metadati dei materiali raccolti sui competitor.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Nome materiale</Label>
                  <Input value={materialForm.nome_file} onChange={(event) => setMaterialForm((current) => ({ ...current, nome_file: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Competitor</Label>
                  <Select value={materialForm.competitor_id} onValueChange={(value) => setMaterialForm((current) => ({ ...current, competitor_id: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non collegato</SelectItem>
                      {competitors.map((competitor) => (
                        <SelectItem key={competitor.id} value={competitor.id}>{competitor.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={materialForm.tipo_materiale} onValueChange={(value) => setMaterialForm((current) => ({ ...current, tipo_materiale: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brochure">Brochure</SelectItem>
                      <SelectItem value="listino">Listino</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="sito_web">Sito web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Stato</Label>
                  <Select value={materialForm.stato} onValueChange={(value) => setMaterialForm((current) => ({ ...current, stato: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caricato">Caricato</SelectItem>
                      <SelectItem value="da_analizzare">Da analizzare</SelectItem>
                      <SelectItem value="analizzato">Analizzato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>URL o riferimento</Label>
                  <Input value={materialForm.url} onChange={(event) => setMaterialForm((current) => ({ ...current, url: event.target.value }))} />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Note</Label>
                  <Input value={materialForm.note} onChange={(event) => setMaterialForm((current) => ({ ...current, note: event.target.value }))} />
                </div>
                <div className="lg:col-span-4">
                  <Button onClick={addMaterial} disabled={createMaterial.isPending || !materialForm.nome_file.trim()}>
                    {createMaterial.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Aggiungi materiale
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materiali salvati</CardTitle>
                <CardDescription>Archivio metadati e link consultabili dallo staff.</CardDescription>
              </CardHeader>
              <CardContent>
                {materialsLoading ? (
                  <p className="text-sm text-muted-foreground">Caricamento materiali...</p>
                ) : materials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun materiale registrato.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {materials.map((material) => (
                      <div key={material.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{material.nome_file}</p>
                            <p className="text-xs text-muted-foreground">{material.competitor_nome || "Non collegato"} - {material.tipo_materiale}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeMaterial(material.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline">{material.stato}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(material.data_creazione)}</span>
                        </div>
                        {material.url && (
                          <a className="mt-3 block truncate text-sm text-primary underline-offset-4 hover:underline" href={material.url} target="_blank" rel="noreferrer">
                            {material.url}
                          </a>
                        )}
                        {material.note && <p className="mt-2 text-sm text-muted-foreground">{material.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="template" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nuovo template commerciale</CardTitle>
                <CardDescription>Prepara messaggi riutilizzabili per aziende, scuole, agenzie e partner.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Titolo</Label>
                  <Input value={templateForm.titolo} onChange={(event) => setTemplateForm((current) => ({ ...current, titolo: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Target</Label>
                  <Select value={templateForm.target_tipo} onValueChange={(value) => setTemplateForm((current) => ({ ...current, target_tipo: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azienda">Azienda</SelectItem>
                      <SelectItem value="scuola">Scuola</SelectItem>
                      <SelectItem value="universita">Universita</SelectItem>
                      <SelectItem value="agenzia">Agenzia</SelectItem>
                      <SelectItem value="palestra">Palestra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>CTA</Label>
                  <Input value={templateForm.cta} onChange={(event) => setTemplateForm((current) => ({ ...current, cta: event.target.value }))} />
                </div>
                <div className="space-y-1.5 lg:col-span-3">
                  <Label>Descrizione target</Label>
                  <Input value={templateForm.target_descrizione} onChange={(event) => setTemplateForm((current) => ({ ...current, target_descrizione: event.target.value }))} />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Messaggio</Label>
                  <Textarea value={templateForm.messaggio} onChange={(event) => setTemplateForm((current) => ({ ...current, messaggio: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vantaggi</Label>
                  <Textarea value={templateForm.vantaggi} onChange={(event) => setTemplateForm((current) => ({ ...current, vantaggi: event.target.value }))} />
                </div>
                <div className="lg:col-span-3">
                  <Button onClick={addTemplate} disabled={createTemplate.isPending || !templateForm.titolo.trim() || !templateForm.messaggio.trim()}>
                    {createTemplate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Aggiungi template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template salvati</CardTitle>
                <CardDescription>Base commerciale reale usata per pitch e proposte.</CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <p className="text-sm text-muted-foreground">Caricamento template...</p>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun template registrato.</p>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {templates.map((template) => (
                      <div key={template.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{template.titolo}</p>
                            <p className="text-xs text-muted-foreground">{template.target_tipo} - {template.utilizzi} utilizzi</p>
                          </div>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeTemplate(template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mt-3 text-sm">{template.messaggio}</p>
                        {template.vantaggi && <p className="mt-2 text-xs text-muted-foreground">Vantaggi: {template.vantaggi}</p>}
                        {template.cta && <Badge className="mt-3">{template.cta}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analisi" className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analisi competitor</CardTitle>
                <CardDescription>Genera una sintesi strutturata usando i dati salvati nel CRM.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Competitor</Label>
                    <Select value={analysisCompetitorId} onValueChange={setAnalysisCompetitorId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Scenario generale</SelectItem>
                        {competitors.map((competitor) => (
                          <SelectItem key={competitor.id} value={competitor.id}>{competitor.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Focus</Label>
                    <Select value={analysisFocus} onValueChange={(value) => setAnalysisFocus(value as AnalysisFocus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generale">Generale</SelectItem>
                        <SelectItem value="prezzo">Prezzo</SelectItem>
                        <SelectItem value="proposta">Proposta</SelectItem>
                        <SelectItem value="debolezze">Debolezze</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Prompt operativo</Label>
                  <Textarea
                    value={analysisPrompt}
                    onChange={(event) => setAnalysisPrompt(event.target.value)}
                    placeholder="Es. evidenzia come differenziare Zak per target corporate..."
                  />
                </div>
                {selectedAnalysisCompetitor && (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Analisi su {selectedAnalysisCompetitor.nome}, target {selectedAnalysisCompetitor.target || "non definito"}.
                  </div>
                )}
                <Button onClick={runAnalysis} disabled={analyzeCompetitor.isPending}>
                  {analyzeCompetitor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Genera analisi
                </Button>

                {analysisResult && (
                  <div className="space-y-4 rounded-md border p-4">
                    <div>
                      <h3 className="font-semibold">{analysisResult.titolo}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{analysisResult.sintesi}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ResultList title="Punti forza" items={analysisResult.punti_forza} />
                      <ResultList title="Punti deboli" items={analysisResult.punti_deboli} />
                      <ResultList title="Opportunita" items={analysisResult.opportunita} />
                      <ResultList title="Azioni consigliate" items={analysisResult.azioni_consigliate} />
                    </div>
                    {analysisResult.confidence && <Badge variant="outline">Confidence {analysisResult.confidence}</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export pitch</CardTitle>
                <CardDescription>Genera un documento testuale o una traccia presentazione dal backend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Titolo</Label>
                    <Input value={pitchTitle} onChange={(event) => setPitchTitle(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target</Label>
                    <Input value={pitchTarget} onChange={(event) => setPitchTarget(event.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Budget</Label>
                    <Input inputMode="numeric" value={pitchBudget} onChange={(event) => setPitchBudget(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Formato</Label>
                    <Select value={pitchFormat} onValueChange={(value) => setPitchFormat(value as ExportFormat)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="presentazione">Presentazione</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Messaggio</Label>
                  <Textarea value={pitchMessage} onChange={(event) => setPitchMessage(event.target.value)} />
                </div>
                <Button onClick={runExport} disabled={exportPitch.isPending || !pitchTitle.trim() || !pitchTarget.trim()}>
                  {exportPitch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  Genera export
                </Button>

                {exportResult && (
                  <div className="space-y-4 rounded-md border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{exportResult.titolo}</h3>
                        <p className="text-sm text-muted-foreground">{exportResult.download_filename}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => downloadTextFile(exportResult)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Scarica
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {exportResult.slides.map((slide, index) => (
                        <div key={`${slide.titolo}-${index}`} className="rounded-md bg-muted/40 p-3">
                          <p className="text-sm font-semibold">{index + 1}. {slide.titolo}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{slide.contenuto}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
