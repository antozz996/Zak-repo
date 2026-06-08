import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FileCheck,
  Download,
  Send,
  Printer,
  Info,
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";

interface Pacchetto {
  nome: string;
  prezzoBase: number;
  cateringPerHead: number;
  serviziCompresi: string[];
}

const pacchettiDisponibili: Record<string, Pacchetto> = {
  standard: {
    nome: "Standard Event",
    prezzoBase: 1000,
    cateringPerHead: 15,
    serviziCompresi: ["Affitto sala base", "Servizio pulizie", "Accoglienza staff"],
  },
  premium: {
    nome: "Premium Party",
    prezzoBase: 2200,
    cateringPerHead: 25,
    serviziCompresi: ["Affitto sala Loft", "Open bar base (2 ore)", "DJ Set & Console inclusi", "Servizio pulizie"],
  },
  luxury: {
    nome: "Luxury Wedding & Corporate",
    prezzoBase: 4500,
    cateringPerHead: 45,
    serviziCompresi: ["Noleggio esclusivo location", "Open bar premium illimitato", "DJ Set & Allestimento luci", "Catering buffet rinforzato", "Servizio accoglienza & sicurezza dedicated"],
  },
};

export default function PreventivoPDFPreview() {
  // Interactive inputs state
  const [clientName, setClientName] = useState("Giulia Bianchi");
  const [clientPhone, setClientPhone] = useState("+39 348 9876543");
  const [clientEmail, setClientEmail] = useState("giulia.bianchi@example.com");
  const [eventType, setEventType] = useState("Laurea");
  const [eventDate, setEventDate] = useState("2026-06-28");
  const [guests, setGuests] = useState(80);
  const [budget, setBudget] = useState(4500);
  const [pacchettoKey, setPacchettoKey] = useState("premium");
  const [note, setNote] = useState("Il cliente richiede menu buffet con opzioni vegetariane ed allestimento con luci colorate.");

  // Simulation Feedback State
  const [simulatedLog, setSimulatedLog] = useState<string | null>(null);

  const triggerSimulation = (msg: string) => {
    setSimulatedLog(msg);
    // Auto-scroll to top or log block
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedPacchetto = pacchettiDisponibili[pacchettoKey] || pacchettiDisponibili.standard;
  
  // Calculate pricing based on guest counts and base price
  const basePrice = selectedPacchetto.prezzoBase;
  const cateringPrice = guests * selectedPacchetto.cateringPerHead;
  const subtotal = basePrice + cateringPrice;
  const vat = subtotal * 0.22;
  const total = subtotal + vat;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Preview PDF Preventivo</h1>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/5">
                Demo
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Simulazione visuale dell'impaginazione in formato A4. La generazione PDF reale verra' implementata in futuro da Codex.
            </p>
          </div>
        </div>

        {/* Demo State Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span><strong>Stato Demo:</strong> Questa pagina usa dati demo locali. Non genera file PDF reali e non invia messaggi.</span>
        </div>

        {/* Simulated Log Output Banner */}
        {simulatedLog && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl text-xs space-y-1 animate-fade-in">
            <p className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Azione Simulata Correttamente
            </p>
            <p className="text-emerald-900">{simulatedLog}</p>
          </div>
        )}

        {/* Split grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Config controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuratore Preventivo</CardTitle>
                <CardDescription>Modifica i campi sottostanti per personalizzare istantaneamente l'anteprima A4.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Client fields */}
                <div className="space-y-2">
                  <Label htmlFor="c-name">Nome Cliente</Label>
                  <Input id="c-name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-phone">Telefono</Label>
                    <Input id="c-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email">Email</Label>
                    <Input id="c-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                  </div>
                </div>

                {/* Event type, date, guests */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="e-type">Tipo Evento</Label>
                    <Input id="e-type" value={eventType} onChange={(e) => setEventType(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-date">Data Evento</Label>
                    <Input id="e-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-guests">Invitati</Label>
                    <Input id="e-guests" type="number" value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
                  </div>
                </div>

                {/* Target budget & Selected Package */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="e-budget">Budget Stimato (EUR)</Label>
                    <Input id="e-budget" type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-package">Pacchetto</Label>
                    <Select value={pacchettoKey} onValueChange={setPacchettoKey}>
                      <SelectTrigger id="e-package">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Event</SelectItem>
                        <SelectItem value="premium">Premium Party</SelectItem>
                        <SelectItem value="luxury">Luxury Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditions / notes */}
                <div className="space-y-2">
                  <Label htmlFor="e-notes">Note ed Dettagli</Label>
                  <Textarea
                    id="e-notes"
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note relative al catering o allestimento..."
                  />
                </div>

                {/* Simulations row */}
                <div className="pt-4 border-t border-border grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => triggerSimulation(`Esportazione in preventivo_${clientName.replace(/\s+/g, "_")}.pdf completata.`)}
                    variant="default"
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Esporta PDF
                  </Button>
                  
                  <Button
                    onClick={() => triggerSimulation(`Notifica WhatsApp inviata a ${clientPhone} con il preventivo ZAK-PREV-2026-001.`)}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Invia WhatsApp
                  </Button>

                  <Button
                    onClick={() => triggerSimulation(`Email con PDF inviata correttamente all'indirizzo ${clientEmail}.`)}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-4 h-4" /> Invia Email
                  </Button>

                  <Button
                    onClick={() => triggerSimulation("Stampa del documento A4 inviata alla stampante predefinita.")}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Stampa
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Right panel: A4 Sheet Simulator (7 Cols) */}
          <div className="lg:col-span-7 flex justify-center overflow-x-auto">
            
            {/* Simulated sheet container */}
            <div className="w-[190mm] min-h-[268mm] bg-white text-slate-900 border border-slate-200 shadow-2xl p-[15mm] flex flex-col justify-between font-[Helvetica,Arial,sans-serif] rounded-sm select-none">
              
              {/* Document top */}
              <div>
                {/* Header venue info */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-5 mb-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">ZAK ECOSYSTEM AI</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Gestione & Automazione Venue</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                    <p>Villa ZAK Events — Milano</p>
                    <p>info@zak-venue.com | +39 02 987654</p>
                  </div>
                </div>

                {/* Metadata & Customer Block */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                  <div>
                    <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cliente</h4>
                    <p className="font-bold text-slate-900 mt-1">{clientName}</p>
                    <p className="text-slate-600 inline-flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-slate-400" /> {clientPhone}</p>
                    <p className="text-slate-600 inline-flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {clientEmail}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Dettaglio Documento</h4>
                    <p className="font-bold text-slate-900 mt-1">Preventivo ZAK-PREV-2026-001</p>
                    <p className="text-slate-600">Data emissione: 02 Giugno 2026</p>
                    <p className="text-slate-600">Valido fino a: 09 Giugno 2026</p>
                  </div>
                </div>

                {/* Event Summary Details */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Tipo Evento</span>
                    <p className="font-bold text-slate-800 mt-0.5">{eventType}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Data Richiesta</span>
                    <p className="font-bold text-slate-800 mt-0.5">{eventDate}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Invitati Stimi</span>
                    <p className="font-bold text-slate-800 mt-0.5">{guests} partecipanti</p>
                  </div>
                </div>

                {/* Table details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-950 border-b border-slate-200 pb-1 uppercase tracking-wider">Voci Economiche</h3>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100">
                        <th className="pb-2">Servizio / Pacchetto</th>
                        <th className="pb-2 text-right w-24">Importo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Base package row */}
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5">
                          <p className="font-semibold text-slate-800">{selectedPacchetto.nome} — Quota base</p>
                          <span className="text-[10px] text-slate-400">Include: {selectedPacchetto.serviziCompresi.join(", ")}</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">{formatCurrency(basePrice)}</td>
                      </tr>

                      {/* Catering row */}
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5">
                          <p className="font-semibold text-slate-800">Servizio Ristorazione / Catering</p>
                          <span className="text-[10px] text-slate-400">{guests} invitati × {formatCurrency(selectedPacchetto.cateringPerHead)}/testa</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">{formatCurrency(cateringPrice)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Document bottom */}
              <div className="space-y-6">
                
                {/* Note and calculation */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-200 pt-5">
                  <div className="flex-1 text-[9px] text-slate-500 space-y-1.5">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider">Note Generali</h4>
                    {note ? <p className="italic">"{note}"</p> : null}
                    <p>La disponibilita' della location e' bloccata solo dopo la ricezione dell'acconto. La validita' dell'offerta scade dopo 7 giorni dall'emissione.</p>
                  </div>

                  <div className="w-44 text-xs text-slate-600 space-y-1.5 text-right shrink-0">
                    <div className="flex justify-between">
                      <span>Totale Imponibile:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA fittizia (22%):</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(vat)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-sm text-slate-950">
                      <span>Totale Lordo:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Call-to-action */}
                <div className={`p-2.5 rounded-lg text-center font-bold text-[10px] uppercase border ${
                  total <= budget
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800"
                    : "bg-amber-500/5 border-amber-500/20 text-amber-800"
                }`}>
                  {total <= budget
                    ? `Il preventivo rientra nel budget stimato di ${formatCurrency(budget)}.`
                    : `Attenzione: supera il budget di ${formatCurrency(total - budget)}.`}
                  <span className="block text-[9px] font-semibold text-slate-500 mt-0.5 normal-case">
                    Azione richiesta: Si prega di confermare la disponibilita' entro 7 giorni dall'emissione.
                  </span>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end pt-6 border-t border-slate-100 text-[9px] text-slate-400 select-none">
                  <div>
                    <p>Firma del cliente per accettazione</p>
                    <div className="w-36 h-6 border-b border-dashed border-slate-300 mt-1.5" />
                  </div>
                  <div className="text-right">
                    <p>Firma per Zak Ecosystem AI</p>
                    <div className="w-36 h-6 border-b border-dashed border-slate-300 mt-1.5" />
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>

      </div>
    </SidebarLayout>
  );
}
