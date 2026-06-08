import { useState } from "react";
import {
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  Send,
  Code,
  Check,
} from "lucide-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ExtractedData {
  nome: string;
  tipo_evento: string;
  data_evento: string;
  numero_invitati: number;
  budget: number;
  confidence: number;
  campi_mancanti: string[];
}

export default function LlmBookingReviewMock() {
  const { toast } = useToast();
  
  // Demo extracted data
  const [extracted, setExtracted] = useState<ExtractedData>({
    nome: "Mario Rossi",
    tipo_evento: "Matrimonio",
    data_evento: "2026-09-12",
    numero_invitati: 80,
    budget: 6000,
    confidence: 0.92,
    campi_mancanti: ["P.IVA/Codice Fiscale"],
  });

  const [status, setStatus] = useState<"valido" | "da_revisionare" | "handoff">("da_revisionare");
  const [viewJson, setViewJson] = useState(false);

  // Raw chat history
  const chatTranscript = [
    { sender: "client", text: "Buonasera, vorrei chiedere informazioni per il mio matrimonio." },
    { sender: "bot", text: "Buonasera! Saro' felice di aiutarla. Per quante persone stima l'evento e in quale data?" },
    { sender: "client", text: "Saremo circa 80 invitati, preferibilmente il 12 settembre 2026." },
    { sender: "bot", text: "Perfetto, data registrata. Ha un budget indicativo per l'affitto e il catering?" },
    { sender: "client", text: "Vorremmo stare entro i 6000 euro tutto compreso." },
    { sender: "bot", text: "Ottimo, ho inserito i dati. Il mio nome e' Mario Rossi, la mia mail e' mario@example.com." },
  ];

  const handleApprove = () => {
    setStatus("valido");
    toast({
      title: "Estrazione Approvata",
      description: "I dati sono stati approvati e salvati nella scheda del contatto.",
    });
  };

  const handleHandoff = () => {
    setStatus("handoff");
    toast({
      title: "Handoff Umano Inviato",
      description: "La conversazione e' stata passata allo staff commerciale.",
    });
  };

  const handleSaveFields = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Campi Salvati",
      description: "Le correzioni manuali dell'estrazione sono state salvate.",
    });
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 border-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-500" /> LLM Assistant Review (Mockup)
            </h1>
            <p className="text-muted-foreground mt-1">
              Pannello di controllo per la validazione dei dati estratti in background dall'AI Booking Assistant.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewJson(!viewJson)}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Code className="w-4 h-4" /> {viewJson ? "Mostra Modulo" : "Mostra JSON"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          
          {/* Transcript Column */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-500" /> Trascrizione Chat
                </CardTitle>
                <CardDescription className="text-[10px]">Chat WhatsApp con Mario Rossi</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 flex-1 overflow-y-auto max-h-[420px]">
                {chatTranscript.map((msg, idx) => {
                  const isBot = msg.sender === "bot";
                  return (
                    <div key={idx} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-xs ${
                        isBot ? "bg-muted text-muted-foreground rounded-tl-none" : "bg-indigo-50 dark:bg-slate-900 border border-indigo-100 text-foreground rounded-tr-none"
                      }`}>
                        <span className="font-bold block text-[9px] mb-0.5 uppercase opacity-75">
                          {isBot ? "ZAK AI Assistant" : "Cliente"}
                        </span>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* AI Parser/Form Column */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> Elaborazione AI & Stato Lead
                  </CardTitle>
                  <div className="flex gap-1.5">
                    {status === "valido" && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-bold text-[9px] uppercase">
                        Valido (Approvato)
                      </Badge>
                    )}
                    {status === "da_revisionare" && (
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 font-bold text-[9px] uppercase">
                        Da Revisionare
                      </Badge>
                    )}
                    {status === "handoff" && (
                      <Badge className="bg-rose-500/10 text-rose-700 border-rose-500/20 font-bold text-[9px] uppercase">
                        Handoff Umano
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-[10px]">
                  Controlla i dati compilati o modifica i campi prima di inserire in agenda.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                
                {viewJson ? (
                  /* JSON View */
                  <div className="space-y-4">
                    <div className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border">
                      {JSON.stringify({
                        status,
                        extracted_fields: extracted,
                        metadata: {
                          parsed_at: "2026-06-02T18:50:00Z",
                          engine: "gpt-4o-mini-zak-v2"
                        }
                      }, null, 2)}
                    </div>
                  </div>
                ) : (
                  /* Editor Form */
                  <form onSubmit={handleSaveFields} className="space-y-4 text-xs">
                    
                    {/* Confidence bar */}
                    <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1.5">
                      <div className="flex justify-between font-bold text-[10px] text-indigo-800">
                        <span>Punteggio Confidenza LLM:</span>
                        <span>{(extracted.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${extracted.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">Nome Contatto</label>
                        <Input
                          value={extracted.nome}
                          onChange={(e) => setExtracted({ ...extracted, nome: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">Tipo Evento</label>
                        <Input
                          value={extracted.tipo_evento}
                          onChange={(e) => setExtracted({ ...extracted, tipo_evento: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">Data Evento</label>
                        <Input
                          type="date"
                          value={extracted.data_evento}
                          onChange={(e) => setExtracted({ ...extracted, data_evento: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">Invitati (Pax)</label>
                        <Input
                          type="number"
                          value={extracted.numero_invitati}
                          onChange={(e) => setExtracted({ ...extracted, numero_invitati: Number(e.target.value) })}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">Budget (€)</label>
                        <Input
                          type="number"
                          value={extracted.budget}
                          onChange={(e) => setExtracted({ ...extracted, budget: Number(e.target.value) })}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    {/* Missing fields warnings */}
                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
                      <span className="font-bold text-amber-800 text-[10px] uppercase flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Informazioni mancanti per preventivo reale
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {extracted.campi_mancanti.join(", ") || "Nessun campo mancante."}
                      </p>
                    </div>

                    {/* Form actions */}
                    <div className="flex gap-2 justify-end border-t border-border pt-4">
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-8 text-xs font-bold border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/5 flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Salva Correzioni
                      </Button>
                      <Button
                        type="button"
                        onClick={handleHandoff}
                        variant="outline"
                        className="h-8 text-xs font-bold border-rose-500/20 text-rose-600 hover:bg-rose-500/5 flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Invia a Operatore
                      </Button>
                      <Button
                        type="button"
                        onClick={handleApprove}
                        className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approva Estrazione
                      </Button>
                    </div>
                  </form>
                )}

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
