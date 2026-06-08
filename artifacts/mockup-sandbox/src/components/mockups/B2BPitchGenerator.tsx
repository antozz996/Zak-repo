import { useState } from "react";
import {
  Sparkles,
  Building2,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Download,
  Share2,
  FileText,
  Mail,
  ArrowRight,
  Sliders,
} from "lucide-react";

export default function B2BPitchGenerator() {
  const [targetType, setTargetType] = useState<"scuola" | "azienda" | "partner">("azienda");
  const [orgName, setOrgName] = useState("Deloitte Milano");
  const [guestsCount, setGuestsCount] = useState(150);
  const [budget, setBudget] = useState(8000);
  const [eventDate, setEventDate] = useState("Dicembre 2026");
  
  // Options state
  const [hasDJ, setHasDJ] = useState(true);
  const [hasOpenBar, setHasOpenBar] = useState(true);
  const [hasBuffet, setHasBuffet] = useState(true);
  const [hasAV, setHasAV] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showPitch, setShowPitch] = useState(true);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPitch(true);
    }, 800);
  };

  const getProposalTitle = () => {
    switch (targetType) {
      case "scuola": return `Proposta Feste di Diploma ed Eventi Studenteschi — ${orgName}`;
      case "azienda": return `Proposta Corporate Event & Team Building — ${orgName}`;
      case "partner": return `Accordo di Partnership Commerciale & Co-branding — ${orgName}`;
    }
  };

  const calculatePriceBreakdown = () => {
    let base = targetType === "scuola" ? 1500 : targetType === "azienda" ? 3000 : 2000;
    let perGuest = targetType === "scuola" ? 15 : targetType === "azienda" ? 35 : 20;
    let extra = 0;
    if (hasDJ) extra += 500;
    if (hasOpenBar) extra += targetType === "azienda" ? 1500 : 1000;
    if (hasBuffet) extra += guestsCount * (targetType === "azienda" ? 15 : 10);
    if (hasAV) extra += 600;

    const subtotal = base + (guestsCount * perGuest) + extra;
    return {
      affitto: base,
      catering: (guestsCount * perGuest) + (hasBuffet ? guestsCount * (targetType === "azienda" ? 15 : 10) : 0),
      servizi: extra - (hasBuffet ? guestsCount * (targetType === "azienda" ? 15 : 10) : 0),
      totale: subtotal
    };
  };

  const prices = calculatePriceBreakdown();

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[Inter,system-ui,sans-serif] pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Generatore Pitch B2B
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Creazione assistita di proposte commerciali per organizzazioni</p>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            Mockup Sandbox
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Parameters (5 Cols) */}
        <section className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-violet-400" />
              Parametri Proposta B2B
            </h3>

            {/* Target Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Tipologia Target</label>
              <div className="flex gap-1.5 border border-white/[0.08] bg-black/30 rounded-xl p-0.5">
                {[
                  { key: "scuola", label: "Scuola" },
                  { key: "azienda", label: "Azienda" },
                  { key: "partner", label: "Partner" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTargetType(t.key as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      targetType === t.key
                        ? "bg-violet-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Azienda / Scuola</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/40"
              />
            </div>

            {/* Attendees and period in row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Partecipanti Stimi</label>
                <input
                  type="number"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Periodo Evento</label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/40"
                />
              </div>
            </div>

            {/* Target Budget */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Budget Indicato dal Cliente</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-3 bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl focus:outline-none focus:border-violet-500/40"
                />
              </div>
            </div>

            {/* Inclusions checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Servizi e Allestimenti Inclusi</label>
              <div className="space-y-2 text-xs text-gray-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasDJ} onChange={(e) => setHasDJ(e.target.checked)} className="rounded border-white/20 accent-violet-600" />
                  <span>DJ Set & Console Audio integrata</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasOpenBar} onChange={(e) => setHasOpenBar(e.target.checked)} className="rounded border-white/20 accent-violet-600" />
                  <span>Open Bar (Cocktail e Analcolici)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasBuffet} onChange={(e) => setHasBuffet(e.target.checked)} className="rounded border-white/20 accent-violet-600" />
                  <span>Servizio Catering a Buffet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasAV} onChange={(e) => setHasAV(e.target.checked)} className="rounded border-white/20 accent-violet-600" />
                  <span>Proiettore, Microfoni & Schermi LED</span>
                </label>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10"
            >
              {isGenerating ? (
                <span>Elaborazione AI...</span>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5" />
                  Genera Pitch su Misura
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Preview: Proposal (7 Cols) */}
        <section className="lg:col-span-7 space-y-4">
          
          {showPitch ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6 relative overflow-hidden">
              
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.06] pb-5">
                <div>
                  <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[9px] font-bold uppercase tracking-wider border border-violet-500/20">
                    Proposta Commerciale
                  </span>
                  <h2 className="text-base font-bold text-white mt-2 leading-tight">{getProposalTitle()}</h2>
                  <p className="text-[10px] text-gray-500 mt-1">Valido fino al: 30 Luglio 2026</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white border border-white/[0.08]" title="Scarica PDF">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white border border-white/[0.08]" title="Condividi">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Proposal Content Body */}
              <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
                <div>
                  <p className="font-bold text-white mb-1">1. Descrizione del Servizio</p>
                  {targetType === "scuola" && (
                    <p>
                      Siamo lieti di proporre al <strong>{orgName}</strong> una soluzione completa ed esclusiva per la festa di fine anno scolastico. ZAK offre una location versatile con spazi dedicati al ballo e alla ristorazione. Il pacchetto include il noleggio esclusivo degli spazi, un servizio di accoglienza e vigilanza dedicato, e allestimenti a tema.
                    </p>
                  )}
                  {targetType === "azienda" && (
                    <p>
                      In merito alla richiesta di <strong>{orgName}</strong> per l'evento aziendale in programma a <strong>{eventDate}</strong>, presentiamo di seguito il nostro pacchetto 'Corporate Classic'. La proposta prevede l'affitto esclusivo della sala eventi, allestita con tecnologie audio-video professionali per presentazioni, seguito da un servizio catering finger-food ed open bar per favorire il networking tra i {guestsCount} partecipanti.
                    </p>
                  )}
                  {targetType === "partner" && (
                    <p>
                      La presente intesa definisce le linee guida per la promozione congiunta e il co-branding tra la nostra venue e <strong>{orgName}</strong>. L'accordo stabilisce tariffe convenzionate per i vostri iscritti/associati, campagne marketing digitali condivise, e l'organizzazione di eventi esclusivi a tariffe agevolate.
                    </p>
                  )}
                </div>

                {/* Included Checklist */}
                <div>
                  <p className="font-bold text-white mb-2">2. Dettagli Servizi Inclusi</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Affitto esclusivo location</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Personale di sala e sicurezza</li>
                    {hasDJ && <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> DJ Set con playlist personalizzata</li>}
                    {hasOpenBar && <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Open bar illimitato</li>}
                    {hasBuffet && <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Buffet rustico caldo e freddo</li>}
                    {hasAV && <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Setup microfoni e proiettore</li>}
                  </ul>
                </div>

                {/* Pricing Table */}
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="font-bold text-white mb-2">3. Riepilogo Economico</p>
                  <div className="space-y-1.5 bg-black/20 p-3 rounded-xl border border-white/[0.04]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quota Affitto Base:</span>
                      <span className="font-semibold text-white">€ {prices.affitto.toLocaleString("it-IT")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Servizio Ristorazione / Catering:</span>
                      <span className="font-semibold text-white">€ {prices.catering.toLocaleString("it-IT")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Servizi Extra & Allestimenti:</span>
                      <span className="font-semibold text-white">€ {prices.servizi.toLocaleString("it-IT")}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/[0.06] pt-2 font-bold text-sm">
                      <span className="text-white">Prezzo Totale (IVA esclusa):</span>
                      <span className="text-emerald-400">€ {prices.totale.toLocaleString("it-IT")}</span>
                    </div>
                  </div>
                </div>

                {/* Comparative to client budget */}
                <div className={`p-3 rounded-xl flex items-center gap-2.5 text-[11px] ${
                  prices.totale <= budget 
                    ? "bg-emerald-500/[0.06] border border-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/[0.06] border border-amber-500/20 text-amber-300"
                }`}>
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>
                    {prices.totale <= budget
                      ? `Il totale calcolato rientra perfettamente nel budget indicato dal cliente (€ ${budget.toLocaleString("it-IT")}). La trattativa ha alte probabilità di successo.`
                      : `Attenzione: Il preventivo supera il budget del cliente di € ${(prices.totale - budget).toLocaleString("it-IT")}. Considera di offrire uno sconto o ridurre alcuni servizi extra.`}
                  </span>
                </div>
              </div>

              {/* PDF Footer simulator */}
              <div className="border-t border-white/[0.06] pt-4 flex justify-between items-center text-[10px] text-gray-500">
                <span>ZAK Ecosystem AI B2B Module</span>
                <span className="flex items-center gap-1">Pronto per l'invio <ArrowRight className="w-3 h-3" /></span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-gray-500">
              Modifica i parametri del form di sinistra e clicca su "Genera Pitch" per visualizzare la proposta.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
