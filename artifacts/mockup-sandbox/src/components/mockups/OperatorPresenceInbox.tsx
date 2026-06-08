import { useState, useEffect } from "react";
import {
  MessageSquare,
  Users,
  Search,
  Check,
  CheckCheck,
  Send,
  Circle,
  MoreVertical,
  Phone
} from "lucide-react";

interface Operatore {
  nome: string;
  stato: "online" | "offline" | "typing";
  email: string;
}

interface Messaggio {
  id: string;
  direzione: "inbound" | "outbound";
  testo: string;
  timestamp: string;
  statoLettura: "inviato" | "consegnato" | "letto";
}

export default function OperatorPresenceInbox() {
  const [operatori, setOperatori] = useState<Operatore[]>([
    { nome: "Alessandro Rossi", stato: "online", email: "alessandro@villazak.com" },
    { nome: "Giuseppe Esposito", stato: "online", email: "giuseppe@villazak.com" },
    { nome: "Chiara Ferrari", stato: "typing", email: "chiara@villazak.com" },
    { nome: "Roberto Martini", stato: "offline", email: "roberto@villazak.com" }
  ]);

  const [messaggi, setMessaggi] = useState<Messaggio[]>([
    { id: "1", direzione: "inbound", testo: "Salve, e' possibile organizzare una festa aziendale per 80 persone il 15 Luglio?", timestamp: "18:01", statoLettura: "letto" },
    { id: "2", direzione: "outbound", testo: "Ciao! Certamente, Villa ZAK e' disponibile per quella data. Abbiamo pacchetti dedicati con catering e DJ set.", timestamp: "18:03", statoLettura: "letto" },
    { id: "3", direzione: "inbound", testo: "Ottimo. Qual e' il budget base per persona comprensivo di open bar?", timestamp: "18:04", statoLettura: "letto" },
    { id: "4", direzione: "outbound", testo: "Il pacchetto Premium aziendale parte da 45€ a persona. Chiara sta preparando un preventivo personalizzato.", timestamp: "18:06", statoLettura: "consegnato" }
  ]);

  const [nuovoMessaggio, setNuovoMessaggio] = useState("");
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);

  // Typing effect simulation
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTypingSimulated) {
      timer = setTimeout(() => {
        setIsTypingSimulated(false);
        setMessaggi((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            direzione: "inbound",
            testo: "Grazie mille, attendo volentieri la proposta dettagliata via email.",
            timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
            statoLettura: "letto"
          }
        ]);
      }, 3500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isTypingSimulated]);

  const handleInviaMessaggio = () => {
    if (!nuovoMessaggio.trim()) return;
    const msg: Messaggio = {
      id: Date.now().toString(),
      direzione: "outbound",
      testo: nuovoMessaggio,
      timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      statoLettura: "inviato"
    };
    setMessaggi([...messaggi, msg]);
    setNuovoMessaggio("");

    // Simulate status update of the message: sent -> delivered -> read
    setTimeout(() => {
      setMessaggi((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, statoLettura: "consegnato" } : m))
      );
    }, 1000);

    setTimeout(() => {
      setMessaggi((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, statoLettura: "letto" } : m))
      );
      // Trigger customer typing simulation
      setIsTypingSimulated(true);
    }, 2500);
  };

  const toggleOperatoreStato = (nome: string) => {
    setOperatori((prev) =>
      prev.map((op) => {
        if (op.nome === nome) {
          const stati: Array<Operatore["stato"]> = ["online", "offline", "typing"];
          const index = stati.indexOf(op.stato);
          const nextStato = stati[(index + 1) % stati.length];
          return { ...op, stato: nextStato };
        }
        return op;
      })
    );
  };

  const SpuntaIcona = ({ stato }: { stato: Messaggio["statoLettura"] }) => {
    if (stato === "inviato") return <Check className="w-3.5 h-3.5 text-stone-400" />;
    if (stato === "consegnato") return <CheckCheck className="w-3.5 h-3.5 text-stone-400" />;
    return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 font-[Inter,system-ui,sans-serif]">
      {/* Workspace Wrapper */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-violet-500" />
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Inbox Operator Presence Mock
              </h1>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-indigo-500/30 text-indigo-400 bg-indigo-500/5">
                Demo
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1.5">
              Simulazione visuale dello stato di presenza degli operatori, indicatori di digitazione in tempo reale e spunte di consegna.
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Chat Window (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col h-[600px] border border-white/[0.08] bg-white/[0.02] rounded-3xl overflow-hidden">
            
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white/[0.04] border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600/10 flex items-center justify-center border border-violet-500/20 font-bold text-violet-400">
                  FC
                </div>
                <div>
                  <h3 className="text-xs font-bold">Filippo Carli</h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Circle className="w-1.5 h-1.5 fill-emerald-400 stroke-none" />
                    WhatsApp Client (Attivo)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/[0.06] rounded-xl text-stone-400 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/[0.06] rounded-xl text-stone-400 hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/40">
              {messaggi.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.direzione === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md rounded-2xl px-4 py-2.5 text-xs relative ${
                      m.direzione === "outbound"
                        ? "bg-violet-600 text-white rounded-tr-none"
                        : "bg-white/[0.04] border border-white/[0.06] text-stone-100 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed">{m.testo}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/50">
                      <span>{m.timestamp}</span>
                      {m.direzione === "outbound" && <SpuntaIcona stato={m.statoLettura} />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicators */}
              {isTypingSimulated && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-stone-400 flex items-center gap-2">
                    <span className="font-semibold text-stone-300">Filippo</span>
                    <span className="flex gap-0.5 items-center">
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Footer Input */}
            <div className="p-4 bg-white/[0.04] border-t border-white/[0.06] flex items-center gap-3 shrink-0">
              <input
                type="text"
                placeholder="Scrivi una risposta..."
                value={nuovoMessaggio}
                onChange={(e) => setNuovoMessaggio(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInviaMessaggio()}
                className="flex-1 bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/40"
              />
              <button
                onClick={handleInviaMessaggio}
                className="p-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors shadow-lg shadow-violet-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Panel: Presence Monitoring (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Operator Presence list */}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02]">
              <div className="p-6 pb-4">
                <h3 className="text-lg font-bold leading-none tracking-tight text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  Presenza Operatori
                </h3>
                <p className="text-xs text-stone-400 mt-1.5">
                  Stato del team in tempo reale. Clicca su un operatore per cambiare lo stato durante la simulazione.
                </p>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div className="divide-y divide-white/[0.06]">
                  {operatori.map((op) => (
                    <div
                      key={op.nome}
                      onClick={() => toggleOperatoreStato(op.nome)}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold">{op.nome}</p>
                        <p className="text-[10px] text-stone-500">{op.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {op.stato === "online" && (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[9px] font-bold">
                            ONLINE
                          </span>
                        )}
                        {op.stato === "offline" && (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-stone-500/30 text-stone-500 bg-stone-500/5 text-[9px] font-bold">
                            OFFLINE
                          </span>
                        )}
                        {op.stato === "typing" && (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-violet-500/30 text-violet-400 bg-violet-500/5 text-[9px] font-bold animate-pulse">
                            STA SCRIVENDO
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic triggers simulation */}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02]">
              <div className="p-6 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Pannello Controllo Simulazione</h3>
              </div>
              <div className="p-6 pt-0 space-y-3">
                <button
                  onClick={() => setIsTypingSimulated(!isTypingSimulated)}
                  className="inline-flex items-center justify-center rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-white/[0.08] hover:bg-white/[0.06] h-9 px-4 py-2 w-full text-white"
                >
                  {isTypingSimulated ? "Ferma Digitazione Cliente" : "Simula Digitazione Cliente (3s)"}
                </button>
                <div className="p-3 bg-white/[0.04] rounded-xl text-[10px] text-stone-400 space-y-1.5">
                  <p className="font-semibold text-stone-200">Come funziona la spunta?</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><span className="text-stone-300 font-bold">Singola spunta grigia</span>: messaggio inviato al provider.</li>
                    <li><span className="text-stone-300 font-bold">Doppia spunta grigia</span>: consegnato al dispositivo del cliente.</li>
                    <li><span className="text-stone-300 font-bold">Doppia spunta blu</span>: letto dal cliente.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
