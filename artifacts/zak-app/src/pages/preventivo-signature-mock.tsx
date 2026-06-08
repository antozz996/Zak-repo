import { useState, useRef, useEffect } from "react";
import {
  FileCheck,
  CheckCircle,
  Calendar,
  Shield,
  Clock,
  User,
  RotateCcw,
} from "lucide-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TimelineEvent {
  time: string;
  desc: string;
  status: "success" | "pending";
}

export default function PreventivoSignatureMock() {
  const { toast } = useToast();

  const [status, setStatus] = useState<"inviato" | "visualizzato" | "firmato" | "scaduto">("visualizzato");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");

  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { time: "02/06/2026 18:30", desc: "Preventivo PRV-2026-0422 creato dallo staff.", status: "success" },
    { time: "02/06/2026 18:32", desc: "Preventivo inviato via WhatsApp a Mario Rossi.", status: "success" },
    { time: "02/06/2026 18:50", desc: "Visualizzato dal client su browser mobile.", status: "success" },
  ]);

  // Interactive signature drawing canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas & set line style
    ctx.strokeStyle = "#312e81"; // Indigo-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }, [signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Prevent scrolling on touch devices
    if ("touches" in e) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Triggers final acceptance
  const handleConfirmSignature = () => {
    if (!acceptedTerms) return;
    if (signatureMode === "draw" && !hasDrawn) return;
    if (signatureMode === "type" && !typedName.trim()) return;

    setStatus("firmato");
    
    const timeNow = new Date().toLocaleDateString("it-IT") + " " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const newEvent: TimelineEvent = {
      time: timeNow,
      desc: `Preventivo firmato digitalmente con successo via ${signatureMode === "draw" ? "firma grafica" : "firma digitata (" + typedName + ")"}`,
      status: "success",
    };
    
    setTimeline((prev) => [...prev, newEvent]);

    toast({
      title: "Contratto Confermato!",
      description: "La firma e' stata registrata correttamente e lo stato e' passato ad ACCETTATO.",
    });
  };

  const isButtonDisabled = !acceptedTerms || 
    (signatureMode === "draw" && !hasDrawn) || 
    (signatureMode === "type" && !typedName.trim());

  return (
    <SidebarLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 border-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileCheck className="w-8 h-8 text-indigo-500" /> Firma Digitale Preventivo (Mockup)
            </h1>
            <p className="text-muted-foreground mt-1">
              Simulatore portale cliente per l'accettazione, compilazione firma ed avanzamento stati preventivo.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">Stato Corrente:</span>
            <Badge className={`text-xs font-bold uppercase tracking-wider ${
              status === "firmato" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
              : status === "visualizzato" ? "bg-indigo-500/10 text-indigo-700 border-indigo-500/20"
              : "bg-slate-400/10 text-slate-700 border-slate-400/20"
            }`}>
              {status}
            </Badge>
          </div>
        </div>

        {status === "firmato" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold animate-pulse">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block">Accettazione Registrata con Successo!</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Il preventivo PRV-2026-0422 risulta firmato. Lo staff commerciale ha ricevuto la notifica di completamento.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Invoice Summary Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-500" /> Dettagli della Proposta
                </CardTitle>
                <CardDescription className="text-[10px]">Riepilogo servizi ed importi contrattuali</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4 border-b pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Venue Partner</span>
                    <span className="font-bold text-foreground">Zak Royal Gardens</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Data Evento</span>
                    <span className="font-bold text-foreground">Sabato 12 Settembre 2026</span>
                  </div>
                </div>

                {/* Event line items summary */}
                <div className="space-y-2 border-b pb-3">
                  <div className="flex justify-between font-medium">
                    <span>Pacchetto Premium (80 Ospiti)</span>
                    <span>€ 7.600,00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>- Noleggio esclusivo interni ed esterni</span>
                    <span>Incluso</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>- Servizio catering e buffet standard</span>
                    <span>Incluso</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Extra - DJ Set & Impianto Audio</span>
                    <span>€ 450,00</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Extra - Allestimenti Floreali</span>
                    <span>€ 600,00</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-bold text-indigo-600">
                  <span>Totale Lordo (IVA Inclusa):</span>
                  <span>€ 9.472,00</span>
                </div>

              </CardContent>
            </Card>

            {/* Timeline event logging */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" /> Cronologia Eventi Preventivo
                </CardTitle>
                <CardDescription className="text-[10px]">Tracciamento delle interazioni cliente (Audit trail)</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                {timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative flex-shrink-0 flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      {idx !== timeline.length - 1 && <span className="w-0.5 bg-indigo-200 flex-1 my-1" />}
                    </div>
                    <div>
                      <span className="font-bold text-[10px] text-muted-foreground block">{event.time}</span>
                      <p className="text-[11px] text-foreground font-medium mt-0.5">{event.desc}</p>
                    </div>
                  </div>
                ))}
                {status !== "firmato" && (
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0 flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-ping" />
                    </div>
                    <div>
                      <span className="font-bold text-[10px] text-muted-foreground block">Ora</span>
                      <p className="text-[11px] text-slate-400 italic font-medium mt-0.5">In attesa di firma...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Signature Box Column */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" /> Firma e Accettazione
                </CardTitle>
                <CardDescription className="text-[10px]">Apponi la firma per confermare la data</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-4 text-xs">
                
                {status === "firmato" ? (
                  <div className="p-4 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-900 text-center space-y-2">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                    <span className="font-bold text-xs block text-foreground">Accettato & Confermato</span>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      La firma digitale e' registrata nei nostri server con indirizzo IP fittizio e marca temporale.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Toggle Signature Mode */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg text-center font-bold text-[10px]">
                      <div
                        onClick={() => setSignatureMode("draw")}
                        className={`py-1.5 rounded cursor-pointer transition-all ${
                          signatureMode === "draw" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Firma Grafica
                      </div>
                      <div
                        onClick={() => setSignatureMode("type")}
                        className={`py-1.5 rounded cursor-pointer transition-all ${
                          signatureMode === "type" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Digita Nome
                      </div>
                    </div>

                    {/* Signature Box Area */}
                    {signatureMode === "draw" ? (
                      <div className="space-y-2">
                        <div className="relative border border-border rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden h-40">
                          <canvas
                            ref={canvasRef}
                            width={300}
                            height={160}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-full cursor-crosshair touch-none"
                          />
                          {!hasDrawn && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/60 text-[10px]">
                              Traccia la tua firma qui
                            </div>
                          )}
                        </div>
                        {hasDrawn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCanvas}
                            className="h-7 text-[10px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Cancella firma
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input
                          placeholder="Digita il tuo nome completo..."
                          value={typedName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypedName(e.target.value)}
                          className="text-xs"
                        />
                        {typedName.trim() && (
                          <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
                            <span className="font-serif italic text-2xl text-indigo-900 tracking-wider font-bold">
                              {typedName}
                            </span>
                            <span className="text-[9px] text-muted-foreground block mt-1">Anteprima Firma Digitale</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Checkbox Termini */}
                    <div className="flex items-start gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <label htmlFor="terms" className="text-[10px] text-muted-foreground leading-normal font-medium cursor-pointer">
                        Dichiaro di aver letto ed accettato le condizioni contrattuali di noleggio e catering di Zak Royal Gardens.
                      </label>
                    </div>

                    <Button
                      onClick={handleConfirmSignature}
                      disabled={isButtonDisabled}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-4 h-4" /> Conferma Preventivo
                    </Button>
                  </>
                )}

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
