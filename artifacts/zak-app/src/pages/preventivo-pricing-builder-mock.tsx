import { useState, useMemo } from "react";
import {
  FileText,
  Calculator,
  Plus,
  Minus,
  CheckCircle,
  FileCheck,
  Percent,
  Download,
} from "lucide-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ExtraItem {
  id: string;
  name: string;
  price: number;
  type: "flat" | "per_pax";
}

export default function PreventivoPricingBuilderMock() {
  const { toast } = useToast();

  const [packageName, setPackageName] = useState<"Basic" | "Premium" | "Luxury" | "Custom">("Premium");
  const [guests, setGuests] = useState(100);
  
  // Selected extras state
  const [selectedExtras, setSelectedExtras] = useState<string[]>(["dj", "decorations"]);

  const packagePricing = {
    Basic: { pricePerPax: 60, name: "Pacchetto Basic", desc: "Noleggio sala base e buffet classico." },
    Premium: { pricePerPax: 95, name: "Pacchetto Premium", desc: "Noleggio esclusivo interni ed esterni, cena servita, audio base." },
    Luxury: { pricePerPax: 150, name: "Pacchetto Luxury", desc: "Esclusivita' totale, menu gourmet, open bar di benvenuto, luci premium." },
    Custom: { pricePerPax: 40, name: "Pacchetto Personalizzato", desc: "Configurazione flessibile per eventi speciali." },
  };

  const extrasList: ExtraItem[] = [
    { id: "dj", name: "DJ Set & Impianto Audio", price: 450, type: "flat" },
    { id: "photo", name: "Fotografo Professionista", price: 750, type: "flat" },
    { id: "open_bar", name: "Open Bar Unlimited", price: 15, type: "per_pax" },
    { id: "decorations", name: "Allestimenti Floreali & Decor", price: 600, type: "flat" },
    { id: "transfer", name: "Servizio Shuttle/Transfer", price: 350, type: "flat" },
  ];

  const handleToggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Dynamic calculations
  const totals = useMemo(() => {
    const paxRate = packagePricing[packageName].pricePerPax;
    const cateringBase = paxRate * guests;
    
    let extrasBase = 0;
    selectedExtras.forEach((extraId) => {
      const extra = extrasList.find((e) => e.id === extraId);
      if (extra) {
        if (extra.type === "per_pax") {
          extrasBase += extra.price * guests;
        } else {
          extrasBase += extra.price;
        }
      }
    });

    // VAT: 10% on catering/food, 22% on entertainment/services/extras
    const vatCatering = cateringBase * 0.10;
    const vatExtras = extrasBase * 0.22;
    const totalVat = vatCatering + vatExtras;
    const grandTotal = cateringBase + extrasBase + totalVat;

    return {
      cateringBase,
      extrasBase,
      vatCatering,
      vatExtras,
      totalVat,
      grandTotal,
    };
  }, [packageName, guests, selectedExtras]);

  const handleExportPdfMock = () => {
    toast({
      title: "Esportazione Avviata",
      description: "Il PDF e' in fase di generazione (simulato).",
    });
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 border-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calculator className="w-8 h-8 text-indigo-500" /> Pricing Builder (Mockup)
            </h1>
            <p className="text-muted-foreground mt-1">
              Calcolatore preventivo in tempo reale con IVA scorporata per servizi ed eventi B2B.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Configurator Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold">1. Configura Pacchetto & Ospiti</CardTitle>
                <CardDescription className="text-[10px]">Scegli la tipologia ed inserisci il numero di pax.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                
                {/* Package Selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(packagePricing) as Array<keyof typeof packagePricing>).map((key) => {
                    const active = packageName === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setPackageName(key)}
                        className={`p-3 border rounded-xl text-center cursor-pointer transition-all ${
                          active
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-card border-border hover:bg-muted text-foreground"
                        }`}
                      >
                        <h4 className="font-bold text-[11px]">{key}</h4>
                        <p className={`text-[10px] mt-0.5 ${active ? "text-indigo-100" : "text-muted-foreground"}`}>
                          € {packagePricing[key].pricePerPax} / pax
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-muted/30 border border-border rounded-xl">
                  <span className="font-bold block text-[10px] text-foreground">
                    {packagePricing[packageName].name}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {packagePricing[packageName].desc}
                  </p>
                </div>

                {/* Guest Modifier */}
                <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                  <div>
                    <span className="font-bold block text-[10px] text-foreground">Numero Invitati</span>
                    <span className="text-[10px] text-muted-foreground">Calcolo del buffet e quota catering</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setGuests(Math.max(10, guests - 5))}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <Input
                      type="number"
                      value={guests}
                      onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                      className="w-16 text-center text-xs h-8"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setGuests(guests + 5)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold">2. Servizi Extra Opzionali (IVA 22%)</CardTitle>
                <CardDescription className="text-[10px]">Aggiungi servizi addizionali per personalizzare l'evento.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 text-xs">
                {extrasList.map((extra) => {
                  const selected = selectedExtras.includes(extra.id);
                  return (
                    <div
                      key={extra.id}
                      onClick={() => handleToggleExtra(extra.id)}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        selected
                          ? "bg-indigo-500/5 border-indigo-500/30 text-foreground"
                          : "bg-card border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                        />
                        <div>
                          <span className={`font-semibold text-xs block ${selected ? "text-indigo-900 font-bold" : "text-foreground"}`}>
                            {extra.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground">IVA ordinaria al 22%</span>
                        </div>
                      </div>
                      <span className="font-bold text-foreground text-xs">
                        € {extra.price} {extra.type === "per_pax" ? "/ pax" : ""}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Pricing Summary Side Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-500" /> Riepilogo Preventivo
                </CardTitle>
                <CardDescription className="text-[10px]">Prospetto fiscale calcolato</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-4 text-xs">
                
                {/* Cost sections */}
                <div className="space-y-2 border-b pb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imponibile Catering (10%):</span>
                    <span className="font-semibold text-foreground">€ {totals.cateringBase.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imponibile Servizi (22%):</span>
                    <span className="font-semibold text-foreground">€ {totals.extrasBase.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2 border-b pb-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Percent className="w-3 h-3 text-indigo-500" /> IVA Somministrazione (10%):</span>
                    <span>€ {totals.vatCatering.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Percent className="w-3 h-3 text-indigo-500" /> IVA Ordinaria (22%):</span>
                    <span>€ {totals.vatExtras.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Imposta Totale (IVA):</span>
                    <span>€ {totals.totalVat.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Totale Preventivo Lordo</span>
                  <div className="text-2xl font-bold text-indigo-600">
                    € {totals.grandTotal.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[9px] text-muted-foreground">Calcolo aggiornato istantaneamente</span>
                </div>

                {/* Ready for PDF Badge */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-800 text-[10px] block uppercase">Pronto per Esportazione PDF</span>
                    <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
                      I dati inseriti contengono tutti i campi obbligatori per generare il file PDF A4 definitivo.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleExportPdfMock}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Genera PDF Preventivo (Mock)
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
