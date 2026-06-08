import { useState } from "react";
import {
  FileText,
  Download,
  Send,
  Printer,
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  FileCheck,
  RefreshCw,
} from "lucide-react";

interface QuoteItem {
  id: number;
  descrizione: string;
  prezzo: number;
}

export default function PreventivoPDFPreview() {
  // Interactive state
  const [clientName, setClientName] = useState("Giulia Bianchi");
  const [clientEmail, setClientEmail] = useState("giulia.bianchi@example.com");
  const [clientPhone, setClientPhone] = useState("+39 348 9876543");
  const [eventDate, setEventDate] = useState("2026-06-28");
  const [guests, setGuests] = useState(80);
  const [eventType, setEventType] = useState("Laurea");

  const [items, setItems] = useState<QuoteItem[]>([
    { id: 1, descrizione: "Affitto esclusivo Sala Loft con impianto audio", prezzo: 1000 },
    { id: 2, descrizione: "Servizio catering a buffet (finger food caldi e freddi)", prezzo: 1200 },
    { id: 3, descrizione: "DJ Set con console e tecnico luci (4 ore)", prezzo: 500 },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);
  };

  const subtotal = items.reduce((sum, item) => sum + item.prezzo, 0);
  const vat = subtotal * 0.22;
  const total = subtotal + vat;

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[Inter,system-ui,sans-serif] pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Mockup Preventivo PDF Preview
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Simulatore impaginazione A4 e invio automatico</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => triggerNotification("PDF esportato con successo nel tuo computer (Simulato).")}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-lg shadow-violet-500/10"
            >
              <Download className="w-4 h-4" /> Esporta PDF
            </button>
            <button
              onClick={() => triggerNotification("Preventivo inviato al cliente via WhatsApp (Simulato).")}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] text-white text-xs font-semibold hover:bg-white/[0.08] transition-colors border border-white/[0.08] inline-flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Invia via WhatsApp
            </button>
          </div>
        </div>
      </header>

      {/* Main split screen layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left pane: Controls & Inputs (5 Cols) */}
        <section className="lg:col-span-4 space-y-5">
          
          {/* Notification Toast */}
          {notification && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-emerald-400 font-semibold animate-fade-in flex items-center gap-2">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Configuration Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersIcon className="w-4.5 h-4.5 text-violet-400" />
              Dati del Preventivo
            </h3>

            {/* Client input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Cliente</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500/40"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Telefono</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-500/40"
                />
              </div>
            </div>

            {/* Event date, type and guests */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo</label>
                <input
                  type="text"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Data</label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Invitati</label>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-violet-500/40"
                />
              </div>
            </div>

            {/* Pricing items config list */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Servizi & Prezzi</label>
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <input
                    type="text"
                    value={item.descrizione}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].descrizione = e.target.value;
                      setItems(newItems);
                    }}
                    className="flex-1 bg-black/40 border border-white/[0.08] text-[11px] text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={item.prezzo}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].prezzo = Number(e.target.value);
                      setItems(newItems);
                    }}
                    className="w-20 bg-black/40 border border-white/[0.08] text-[11px] text-white rounded-lg px-2.5 py-1.5 focus:outline-none text-right"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right pane: A4 document simulator (8 Cols) */}
        <section className="lg:col-span-8 flex justify-center">
          
          {/* A4 Container Page */}
          <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[20mm] rounded-sm font-[Helvetica,Arial,sans-serif] flex flex-col justify-between select-none">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">VILLA ZAK EVENTS</h2>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Sass & Event Venue Management</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                  <p>Via della Spiga, 12 — Milano</p>
                  <p>info@villazak.com — +39 02 123456</p>
                  <p>www.villazak.com</p>
                </div>
              </div>

              {/* Document info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destinatario</h4>
                  <p className="text-sm font-bold text-slate-900 mt-1">{clientName}</p>
                  <p className="text-xs text-slate-600">{clientEmail}</p>
                  <p className="text-xs text-slate-600">{clientPhone}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Documento</h4>
                  <p className="text-sm font-bold text-slate-900 mt-1">Preventivo #PRV-2026-0042</p>
                  <p className="text-xs text-slate-600">Data emissione: 02 Giugno 2026</p>
                  <p className="text-xs text-slate-600">Scadenza offerta: 16 Giugno 2026</p>
                </div>
              </div>

              {/* Event details box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Tipo Evento</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{eventType}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Data Concordata</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{eventDate}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Numero Ospiti</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{guests} invitati</p>
                </div>
              </div>

              {/* Table of items */}
              <table className="w-full text-left text-xs mb-8">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 font-bold">
                    <th className="pb-2">Descrizione Servizio</th>
                    <th className="pb-2 text-right w-24">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-3 text-slate-800 font-medium">{item.descrizione}</td>
                      <td className="py-3 text-right font-bold text-slate-900">{formatCurrency(item.prezzo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations breakdown & Terms */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-200 pt-6">
                
                {/* Terms conditions */}
                <div className="flex-1 text-[9px] text-slate-500 space-y-1">
                  <h4 className="font-bold text-slate-700 uppercase">Termini e Condizioni</h4>
                  <p>1. La validità del presente preventivo è di 14 giorni dalla data di emissione.</p>
                  <p>2. Il blocco ufficiale della data avviene esclusivamente al versamento dell'acconto del 30%.</p>
                  <p>3. Il saldo complessivo dovrà essere corrisposto entro e non oltre 7 giorni prima dell'evento.</p>
                </div>

                {/* Calculation */}
                <div className="w-48 text-xs text-slate-600 space-y-1.5 text-right shrink-0">
                  <div className="flex justify-between">
                    <span>Imponibile:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (22%):</span>
                    <span className="font-medium text-slate-800">{formatCurrency(vat)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-sm text-slate-900">
                    <span>Totale Lordo:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Signature block */}
              <div className="flex justify-between items-end mt-12 pt-8 border-t border-slate-100 text-[10px] text-slate-400 select-none">
                <div>
                  <p>Firma per accettazione del cliente</p>
                  <div className="w-40 h-8 border-b border-dashed border-slate-300 mt-2" />
                </div>
                <div className="text-right">
                  <p>Firma Direzione Villa ZAK</p>
                  <div className="w-40 h-8 border-b border-dashed border-slate-300 mt-2" />
                </div>
              </div>
            </div>
            
          </div>
        </section>
      </main>
    </div>
  );
}

function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  );
}
