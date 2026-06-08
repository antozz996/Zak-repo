import { useState } from "react";
import {
  Search,
  MessageSquare,
  Phone,
  Instagram,
  ArrowLeft,
  Send,
  MoreVertical,
  Plus,
  Filter,
  Check,
  CheckCheck,
  User,
  Sparkles,
  Bot,
  Wifi,
  Battery,
} from "lucide-react";

interface ChatItem {
  id: number;
  nome: string;
  canale: "whatsapp" | "instagram" | "voice";
  ultimoMessaggio: string;
  ora: string;
  nonLetti: number;
  tipoEvento: string;
  operatore?: string;
  statoAI: "attivo" | "pausa";
}

const chatsDemo: ChatItem[] = [
  { id: 1, nome: "Marco Rossi", canale: "whatsapp", ultimoMessaggio: "Sto preparando le proposte. Ti invio a breve...", ora: "09:12", nonLetti: 0, tipoEvento: "compleanno", operatore: "Giuseppe", statoAI: "pausa" },
  { id: 2, nome: "Giulia Bianchi", canale: "instagram", ultimoMessaggio: "Sì certo, il mio numero è +39 348 9876543.", ora: "09:42", nonLetti: 1, tipoEvento: "laurea", statoAI: "attivo" },
  { id: 3, nome: "Davide Moretti", canale: "voice", ultimoMessaggio: "[Telefonata Vocale] Richiesta cena aziendale 40 pax", ora: "12:00", nonLetti: 2, tipoEvento: "aziendale", statoAI: "attivo" },
  { id: 4, nome: "Elena Marchetti", canale: "whatsapp", ultimoMessaggio: "Potete evitare di mandare email con il vostro...", ora: "12:10", nonLetti: 1, tipoEvento: "compleanno", statoAI: "attivo" },
  { id: 5, nome: "Valentina Conte", canale: "whatsapp", ultimoMessaggio: "Ottimo, allora inviami pure la proposta aggiornata", ora: "11:05", nonLetti: 0, tipoEvento: "laurea", operatore: "Giuseppe", statoAI: "pausa" },
];

interface Messaggio {
  id: number;
  mittente: "cliente" | "staff" | "ai";
  testo: string;
  ora: string;
  stato?: "inviato" | "consegnato" | "letto";
}

const messaggiIniziali: Record<number, Messaggio[]> = {
  1: [
    { id: 1, mittente: "cliente", testo: "Ciao! Vorrei informazioni per organizzare una festa per i miei 30 anni.", ora: "09:00" },
    { id: 2, mittente: "ai", testo: "Ciao Marco! Auguri in anticipo per i tuoi 30 anni. Certo ti posso aiutare. Quanti invitati prevedi e per quale periodo?", ora: "09:02", stato: "letto" },
    { id: 3, mittente: "cliente", testo: "Saremo circa 50 persone a metà giugno. Avete disponibilità per il weekend del 20?", ora: "09:05" },
    { id: 4, mittente: "ai", testo: "Sì il 20 giugno è attualmente disponibile. Desideri un pacchetto con open bar o solo affitto sala?", ora: "09:07", stato: "letto" },
    { id: 5, mittente: "cliente", testo: "Vorrei capire i prezzi per entrambe le opzioni se possibile.", ora: "09:10" },
    { id: 6, mittente: "staff", testo: "Ciao Marco sono Giuseppe dello staff. Ho preparato la proposta da 1200 euro. Te la invio qui su WhatsApp.", ora: "09:15", stato: "letto" },
  ],
  2: [
    { id: 1, mittente: "cliente", testo: "Salve! Ho visto le vostre storie. Fate anche feste di laurea?", ora: "09:30" },
    { id: 2, mittente: "ai", testo: "Ciao Giulia! Certamente organizziamo splendide feste di laurea con buffet e DJ set. Per quante persone pensavi?", ora: "09:32", stato: "letto" },
    { id: 3, mittente: "cliente", testo: "Saremo circa 80 persone. Vorrei fare un open bar con catering a buffet a fine mese.", ora: "09:35" },
    { id: 4, mittente: "ai", testo: "Perfetto per 80 persone abbiamo la nostra sala Loft. Posso avere un recapito telefonico per mandarti i dettagli?", ora: "09:40", stato: "letto" },
    { id: 5, mittente: "cliente", testo: "Sì certo, il mio numero è +39 348 9876543.", ora: "09:42" },
  ],
};

export default function MobileInbox() {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatItem[]>(chatsDemo);
  const [messaggi, setMessaggi] = useState<Record<number, Messaggio[]>>(messaggiIniziali);
  const [inputText, setInputText] = useState("");
  const [filterCanale, setFilterCanale] = useState<string>("tutti");

  const activeChat = chats.find(c => c.id === activeChatId);

  const selectChat = (id: number) => {
    setActiveChatId(id);
    // Mark as read
    setChats(chats.map(c => c.id === id ? { ...c, nonLetti: 0 } : c));
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeChatId) return;

    const nuovoMsg: Messaggio = {
      id: Date.now(),
      mittente: "staff",
      testo: inputText,
      ora: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      stato: "letto",
    };

    setMessaggi({
      ...messaggi,
      [activeChatId]: [...(messaggi[activeChatId] || []), nuovoMsg],
    });

    // Update last message in chat list
    setChats(chats.map(c => c.id === activeChatId ? { ...c, ultimoMessaggio: inputText } : c));
    setInputText("");
  };

  const toggleAI = (id: number) => {
    setChats(chats.map(c => {
      if (c.id === id) {
        const nuovoStato = c.statoAI === "attivo" ? "pausa" : "attivo";
        return { ...c, statoAI: nuovoStato };
      }
      return c;
    }));
  };

  const filteredChats = chats.filter(c => {
    if (filterCanale === "tutti") return true;
    return c.canale === filterCanale;
  });

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 flex items-center justify-center font-[Inter,sans-serif]">
      {/* Mobile Device Container */}
      <div className="w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[40px] border-[10px] border-slate-800 shadow-2xl relative flex flex-col overflow-hidden text-white">
        
        {/* Device Status Bar */}
        <div className="h-9 bg-slate-950 flex items-center justify-between px-6 pt-2 shrink-0 select-none z-10">
          <span className="text-xs font-semibold text-slate-300">12:22</span>
          {/* Dynamic Island simulator */}
          <div className="w-24 h-4 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {activeChatId === null ? (
          /* --- CHAT LIST VIEW --- */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            {/* App Header */}
            <header className="p-4 flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Inbox ZAK</h1>
                <p className="text-[10px] text-gray-500">Gestione conversazioni live</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-white/[0.04] text-gray-400 hover:text-white">
                  <Search className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-full bg-white/[0.04] text-gray-400 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Filter Pills */}
            <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto shrink-0 select-none no-scrollbar">
              {["tutti", "whatsapp", "instagram", "voice"].map((can) => (
                <button
                  key={can}
                  onClick={() => setFilterCanale(can)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    filterCanale === can
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-white/[0.04] border-white/[0.06] text-gray-400 hover:text-white"
                  }`}
                >
                  {can}
                </button>
              ))}
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] px-2">
              {filteredChats.map((c) => {
                const Icon = c.canale === "whatsapp" ? MessageSquare : c.canale === "instagram" ? Instagram : Phone;
                const iconColor = c.canale === "whatsapp" ? "text-emerald-400 bg-emerald-500/10" : c.canale === "instagram" ? "text-pink-400 bg-pink-500/10" : "text-sky-400 bg-sky-500/10";
                
                return (
                  <div
                    key={c.id}
                    onClick={() => selectChat(c.id)}
                    className="p-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors rounded-2xl cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white truncate">{c.nome}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">{c.ora}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate leading-snug">{c.ultimoMessaggio}</p>
                      
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-medium text-gray-500 bg-white/[0.05] border border-white/[0.05] px-1.5 py-0.5 rounded-md uppercase">
                          {c.tipoEvento}
                        </span>
                        {c.operatore && (
                          <span className="text-[9px] font-semibold text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                            <User className="w-2.5 h-2.5" /> {c.operatore}
                          </span>
                        )}
                        {c.statoAI === "pausa" ? (
                          <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                            AI Off
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                            <Bot className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                      </div>
                    </div>

                    {c.nonLetti > 0 && (
                      <span className="w-5 h-5 rounded-full bg-violet-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.nonLetti}
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredChats.length === 0 && (
                <p className="text-center py-10 text-xs text-gray-500">Nessuna conversazione</p>
              )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="h-14 border-t border-white/[0.06] bg-slate-950/80 backdrop-blur-md flex items-center justify-around text-gray-500 shrink-0 select-none">
              <button className="flex flex-col items-center gap-0.5 text-violet-400">
                <MessageSquare className="w-5 h-5" />
                <span className="text-[8px] font-semibold">Chat</span>
              </button>
              <button className="flex flex-col items-center gap-0.5 hover:text-white">
                <Phone className="w-5 h-5" />
                <span className="text-[8px] font-semibold">Chiamate</span>
              </button>
              <button className="flex flex-col items-center gap-0.5 hover:text-white">
                <User className="w-5 h-5" />
                <span className="text-[8px] font-semibold">Contatti</span>
              </button>
            </div>
          </div>
        ) : (
          /* --- ACTIVE CHAT ROOM VIEW --- */
          <div className="flex-1 flex flex-col min-h-0 bg-[#0f172a]">
            {/* Chat Header */}
            <header className="p-3 bg-slate-950 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setActiveChatId(null)}
                  className="p-1 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate leading-tight">{activeChat?.nome}</h3>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 leading-none">
                    {activeChat?.statoAI === "attivo" ? "AI Attiva e in ascolto" : "AI disattivata da Staff"}
                  </span>
                </div>
              </div>

              {/* AI toggle switcher */}
              <button
                onClick={() => toggleAI(activeChatId)}
                className={`px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1 border ${
                  activeChat?.statoAI === "attivo"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {activeChat?.statoAI === "attivo" ? "Pausa AI" : "Avvia AI"}
              </button>
            </header>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900/40">
              {(messaggi[activeChatId] || []).map((m) => {
                const isMe = m.mittente !== "cliente";
                const isAI = m.mittente === "ai";
                
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    {isAI && (
                      <span className="text-[8px] text-emerald-400 font-bold mb-0.5 uppercase tracking-wider flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" /> Risposta Bot AI
                      </span>
                    )}
                    {m.mittente === "staff" && (
                      <span className="text-[8px] text-violet-400 font-bold mb-0.5 uppercase tracking-wider">
                        Staff
                      </span>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isAI
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-50 text-right"
                          : isMe
                          ? "bg-violet-600 text-white rounded-tr-none"
                          : "bg-slate-800 text-slate-100 rounded-tl-none"
                      }`}
                    >
                      {m.testo}
                    </div>
                    <span className="text-[8px] text-gray-500 mt-1 flex items-center gap-0.5">
                      {m.ora} {isMe && <CheckCheck className="w-3 h-3 text-violet-400" />}
                    </span>
                  </div>
                );
              })}
              
              {activeChatId === 3 && (
                /* Simulated Voice Transcription block */
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.05] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-sky-500/10 pb-1.5">
                    <span className="font-bold text-sky-400 inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Telefonata Gestita
                    </span>
                    <span className="text-[9px] text-gray-500">Oggi 12:00</span>
                  </div>
                  <p className="text-gray-300 italic leading-relaxed">
                    "Buongiorno, vorrei informazioni per organizzare una cena aziendale il prossimo dicembre. Saremo circa 40 persone e ci servirebbe un proiettore."
                  </p>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded-lg hover:bg-sky-500/30 transition-colors">
                      Ascolta Audio
                    </button>
                    <button className="px-2 py-1 bg-white/5 text-gray-300 text-[10px] font-bold rounded-lg hover:bg-white/10 transition-colors">
                      Crea Preventivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-950 border-t border-white/[0.06] flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Scrivi messaggio..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/40"
              />
              <button
                onClick={handleSend}
                className="p-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
