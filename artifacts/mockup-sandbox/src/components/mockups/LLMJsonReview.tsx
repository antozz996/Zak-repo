import { useState } from "react";
import {
  Sparkles,
  MessageSquare,
  Bot,
  User,
  CheckCircle,
  AlertTriangle,
  Code,
  Save,
  Send,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface ExtractedData {
  cliente_nome: string;
  tipo_evento: "compleanno" | "laurea" | "matrimonio" | "aziendale" | "altro" | "sconosciuto";
  data_evento: string;
  numero_invitati: number;
  budget_stimato: number;
  preferenze: string[];
  livello_confidenza: "alto" | "medio" | "basso";
}

export default function LLMJsonReview() {
  const [viewJson, setViewJson] = useState(false);
  const [status, setStatus] = useState<"da_revisionare" | "approvato" | "handoff">("da_revisionare");

  // Mock extracted data
  const [extracted, setExtracted] = useState<ExtractedData>({
    cliente_nome: "Giovanni Rossi",
    tipo_evento: "matrimonio",
    data_evento: "2026-09-12",
    numero_invitati: 100,
    budget_stimato: 12000,
    preferenze: ["open bar", "buffet vegetariano", "dj set"],
    livello_confidenza: "alto",
  });

  // Mock WhatsApp Transcript
  const chatMessages = [
    { sender: "client", text: "Buongiorno, vorrei informazioni per il mio matrimonio.", time: "18:25" },
    { sender: "bot", text: "Buongiorno! Saro' lieto di aiutarti. Per quante persone stima l'evento e per quale data?", time: "18:25" },
    { sender: "client", text: "Saremo circa 100 invitati, preferibilmente il 12 settembre 2026.", time: "18:27" },
    { sender: "bot", text: "Data e numero invitati registrati. Ha gia' stabilito un budget indicativo e ci sono servizi particolari che desidera?", time: "18:27" },
    { sender: "client", text: "Vorremmo stare entro i 12000 euro. E ci piacerebbe un dj set, il buffet vegetariano e l'open bar.", time: "18:30" },
    { sender: "bot", text: "Ottimo! Ho inserito tutti i dettagli. Mi conferma il suo nome completo per favore?", time: "18:30" },
    { sender: "client", text: "Sono Giovanni Rossi.", time: "18:31" },
  ];

  const handleApprove = () => {
    setStatus("approvato");
    alert("Estrazione AI Approvata! Lead inserito nel CRM.");
  };

  const handleHandoff = () => {
    setStatus("handoff");
    alert("Handoff attivato. AI disattivata per questa chat.");
  };

  const handleAddPreference = () => {
    const pref = prompt("Inserisci una nuova preferenza:");
    if (pref) {
      setExtracted({
        ...extracted,
        preferenze: [...extracted.preferenze, pref],
      });
    }
  };

  const handleRemovePreference = (index: number) => {
    setExtracted({
      ...extracted,
      preferenze: extracted.preferenze.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight">Review Estrazione LLM</h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Verifica ed approva i dati estratti dall'AI Booking Assistant prima di confermare il lead.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewJson(!viewJson)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Code className="w-4 h-4" />
            {viewJson ? "Visualizza Modulo" : "Visualizza JSON"}
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* WhatsApp Chat Panel (2/5 size) */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Conversazione WhatsApp
            </span>
            <span className="text-[10px] text-slate-400">ID Contatto: #7412</span>
          </div>

          {/* Messages Log */}
          <div className="p-4 flex-grow overflow-y-auto space-y-3.5 max-h-[460px] text-xs">
            {chatMessages.map((msg, idx) => {
              const isBot = msg.sender === "bot";
              return (
                <div key={idx} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-1 relative shadow-md ${
                    isBot
                      ? "bg-slate-900 text-slate-300 rounded-tl-none border border-slate-800"
                      : "bg-emerald-600/10 border border-emerald-500/25 text-emerald-300 rounded-tr-none"
                  }`}>
                    <span className="font-bold uppercase text-[8px] tracking-wider text-slate-500 flex items-center gap-1">
                      {isBot ? <Bot className="w-3 h-3 text-indigo-400" /> : <User className="w-3 h-3 text-emerald-400" />}
                      {isBot ? "AI Assistant" : "Cliente"}
                    </span>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[8px] text-slate-500 block text-right mt-1">{msg.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Parser Panel (3/5 size) */}
        <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-xl flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Elaborazione AI & Parametri Estratti
            </span>
            <div className="flex gap-1.5">
              {status === "da_revisionare" && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase rounded">
                  Da Revisionare
                </span>
              )}
              {status === "approvato" && (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase rounded">
                  Approvato
                </span>
              )}
              {status === "handoff" && (
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase rounded">
                  Handoff Umano
                </span>
              )}
            </div>
          </div>

          <div className="p-5 flex-grow text-xs space-y-4">
            {viewJson ? (
              /* Raw JSON Tree View */
              <div className="space-y-4">
                <div className="bg-slate-950 text-indigo-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                  {JSON.stringify(
                    {
                      extracted_data: extracted,
                      metadata: {
                        model: "gpt-4o-mini-zak-v1",
                        processed_at: "2026-06-04T15:45:00Z",
                        system_version: "2.1.0",
                      },
                    },
                    null,
                    2
                  )}
                </div>
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 rounded-xl text-[10px] flex items-start gap-2">
                  <Code className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Questo JSON rispetta rigorosamente lo schema specificato in `LLM_BOOKING_ASSISTANT_SPEC.md` ed e' pronto per l'importazione automatica.
                  </span>
                </div>
              </div>
            ) : (
              /* Editable Validator Form */
              <div className="space-y-4">
                {/* Confidence Bar */}
                <div className="p-3 bg-slate-900 border border-slate-700/50 rounded-xl space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px] text-slate-400">
                    <span>Grado Confidenza NLU:</span>
                    <span className="text-indigo-400">Alto (92%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full w-[92%]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                      Nome Cliente
                    </label>
                    <input
                      type="text"
                      value={extracted.cliente_nome}
                      onChange={(e) => setExtracted({ ...extracted, cliente_nome: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                      Tipo Evento
                    </label>
                    <select
                      value={extracted.tipo_evento}
                      onChange={(e) => setExtracted({ ...extracted, tipo_evento: e.target.value as ExtractedData["tipo_evento"] })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="compleanno">Compleanno</option>
                      <option value="laurea">Laurea</option>
                      <option value="matrimonio">Matrimonio</option>
                      <option value="aziendale">Aziendale</option>
                      <option value="altro">Altro</option>
                      <option value="sconosciuto">Sconosciuto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                      Data Evento
                    </label>
                    <input
                      type="date"
                      value={extracted.data_evento}
                      onChange={(e) => setExtracted({ ...extracted, data_evento: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                      Invitati (Pax)
                    </label>
                    <input
                      type="number"
                      value={extracted.numero_invitati}
                      onChange={(e) => setExtracted({ ...extracted, numero_invitati: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      value={extracted.budget_stimato}
                      onChange={(e) => setExtracted({ ...extracted, budget_stimato: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                </div>

                {/* Preference Tag cloud */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                      Preferenze ed Extra Richiesti
                    </label>
                    <button
                      onClick={handleAddPreference}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold text-[10px]"
                    >
                      + Aggiungi
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extracted.preferenze.map((pref, index) => (
                      <span
                        key={index}
                        className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded px-2 py-0.5 text-[10px] flex items-center gap-1"
                      >
                        {pref}
                        <button
                          onClick={() => handleRemovePreference(index)}
                          className="hover:text-rose-400 text-slate-500"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {extracted.preferenze.length === 0 && (
                      <span className="text-slate-500 italic text-[10px]">Nessuna preferenza rilevata.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="p-4 border-t border-slate-700 bg-slate-900/35 flex flex-wrap gap-2 justify-end">
            <button
              onClick={handleHandoff}
              className="bg-slate-700 hover:bg-slate-650 text-rose-300 border border-slate-650 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Passa a Operatore
            </button>
            <button
              onClick={handleApprove}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approva Estrazione
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
