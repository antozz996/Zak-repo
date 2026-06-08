import { useState } from "react";
import {
  User,
  Phone,
  MessageSquare,
  FileText,
  CheckSquare,
  Plus,
  Filter,
  Calendar,
  Instagram,
  Mail,
  Bot,
  UserCheck,
  Send,
  AlertCircle,
  Play,
} from "lucide-react";

interface TimelineEvent {
  id: number;
  tipo: "messaggio" | "chiamata" | "preventivo" | "task" | "nota" | "sistema";
  titolo: string;
  descrizione: string;
  timestamp: string;
  autore: "cliente" | "staff" | "ai" | "sistema";
  metadati?: {
    durata?: string;
    importo?: number;
    scadenza?: string;
    stato?: string;
    linkAudio?: boolean;
  };
}

const initialEvents: TimelineEvent[] = [
  { id: 1, tipo: "sistema", titolo: "Nuovo Lead Creato", descrizione: "Origine lead: Sito Web (form contatti)", timestamp: "2026-06-01 10:15", autore: "sistema" },
  { id: 2, tipo: "messaggio", titolo: "Messaggio WhatsApp Ricevuto", descrizione: "Ciao! Vorrei info per matrimonio il 12 settembre 2026. Saremo circa 100 invitati.", timestamp: "2026-06-01 10:16", autore: "cliente" },
  { id: 3, tipo: "messaggio", titolo: "Risposta Automatica AI", descrizione: "Grazie per averci contattato! Il 12 settembre è disponibile. Prepariamo un preventivo su misura...", timestamp: "2026-06-01 10:17", autore: "ai" },
  { id: 4, tipo: "chiamata", titolo: "Chiamata Gestita da Assistente Vocale", descrizione: "Il cliente conferma di volere un rito simbolico all'aperto e un menu con opzioni vegane.", timestamp: "2026-06-01 15:30", autore: "ai", metadati: { durata: "3m 45s", linkAudio: true } },
  { id: 5, tipo: "nota", titolo: "Nota Staff Aggiunta", descrizione: "Attenzione: cliente molto esigente sul catering. Richiede menu degustazione pre-conferma.", timestamp: "2026-06-01 16:00", autore: "staff" },
  { id: 6, tipo: "preventivo", titolo: "Preventivo Creato", descrizione: "Matrimonio rito simbolico all'aperto (Luca Verdi)", timestamp: "2026-06-01 16:30", autore: "staff", metadati: { importo: 12500, stato: "opzionato" } },
  { id: 7, tipo: "task", titolo: "Task Assegnato", descrizione: "Richiamare Luca Verdi per concordare data degustazione.", timestamp: "2026-06-02 09:00", autore: "sistema", metadati: { scadenza: "Oggi 16:30", stato: "aperto" } },
];

export default function ContactTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [activeFilter, setActiveFilter] = useState<string>("tutti");
  const [noteInput, setNoteInput] = useState("");
  const [taskInput, setTaskInput] = useState("");

  const addNote = () => {
    if (!noteInput.trim()) return;
    const newEvent: TimelineEvent = {
      id: Date.now(),
      tipo: "nota",
      titolo: "Nota Staff Aggiunta",
      descrizione: noteInput,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      autore: "staff",
    };
    setEvents([newEvent, ...events]);
    setNoteInput("");
  };

  const addTask = () => {
    if (!taskInput.trim()) return;
    const newEvent: TimelineEvent = {
      id: Date.now(),
      tipo: "task",
      titolo: "Nuovo Task Operativo",
      descrizione: taskInput,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      autore: "staff",
      metadati: {
        scadenza: "Domani 12:00",
        stato: "aperto",
      },
    };
    setEvents([newEvent, ...events]);
    setTaskInput("");
  };

  const filteredEvents = events.filter(e => {
    if (activeFilter === "tutti") return true;
    return e.tipo === activeFilter;
  });

  const getEventStyle = (tipo: TimelineEvent["tipo"]) => {
    switch (tipo) {
      case "messaggio": return { icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "chiamata": return { icon: Phone, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
      case "preventivo": return { icon: FileText, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "task": return { icon: CheckSquare, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
      case "nota": return { icon: UserCheck, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      default: return { icon: User, color: "text-gray-400 bg-gray-500/10 border-gray-500/20" };
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[Inter,system-ui,sans-serif] pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Timeline Contatto & Attività
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Storico centralizzato eventi cliente</p>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            Mockup Sandbox
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Contact Info card & Quick Forms */}
        <section className="space-y-6 lg:col-span-1">
          
          {/* Customer Profile Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold text-white">
                LV
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Luca Verdi</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-1 inline-block">
                  Qualificato
                </span>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4 space-y-3 text-xs text-gray-300">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>+39 320 5551234</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>luca.verdi@example.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Instagram className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">Non collegato</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Matrimonio — Settembre 2026</span>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4">
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Note Interna</p>
              <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                Matrimonio settembre 2026 - budget alto - richiede preventivo dettagliato.
              </p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <h4 className="text-sm font-bold text-white">Azioni Rapide</h4>
            
            {/* Add note form */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase">Aggiungi Nota Staff</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scrivi nota interna..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  className="flex-1 bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/40"
                />
                <button onClick={addNote} className="p-2.5 bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add task form */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase">Assegna Nuovo Task</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Titolo del task da fare..."
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className="flex-1 bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/40"
                />
                <button onClick={addTask} className="p-2.5 bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right column: Timeline feed */}
        <section className="lg:col-span-2 space-y-4">
          
          {/* Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06] select-none no-scrollbar">
            {[
              { key: "tutti", label: "Tutti gli Eventi" },
              { key: "messaggio", label: "Messaggi" },
              { key: "chiamata", label: "Telefonate" },
              { key: "preventivo", label: "Preventivi" },
              { key: "task", label: "Task" },
              { key: "nota", label: "Note" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-1 ${
                  activeFilter === f.key
                    ? "bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white shadow-lg shadow-violet-500/10"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timeline Feed */}
          <div className="relative border-l border-white/[0.08] ml-4 pl-6 space-y-6 pt-2">
            {filteredEvents.map((e) => {
              const style = getEventStyle(e.tipo);
              const EventIcon = style.icon;
              
              return (
                <div key={e.id} className="relative group">
                  {/* Circular Node Icon */}
                  <span className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-lg flex items-center justify-center border ${style.color}`}>
                    <EventIcon className="w-3.5 h-3.5" />
                  </span>

                  {/* Content Card */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.1] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{e.titolo}</h4>
                        {e.autore === "ai" && (
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Bot className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                        {e.autore === "staff" && (
                          <span className="text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                            Staff
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">{e.timestamp}</span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed font-medium">{e.descrizione}</p>

                    {/* Metadata Renderers */}
                    {e.metadati && (
                      <div className="mt-3 pt-3 border-t border-white/[0.04] flex flex-wrap gap-4 text-[10px] font-semibold">
                        {e.metadati.durata && (
                          <span className="text-sky-400 flex items-center gap-1">
                            Durata: {e.metadati.durata}
                          </span>
                        )}
                        {e.metadati.linkAudio && (
                          <button className="text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20">
                            <Play className="w-3 h-3 fill-sky-400" /> Riproduci registrazione
                          </button>
                        )}
                        {e.metadati.importo !== undefined && (
                          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            Importo: € {e.metadati.importo.toLocaleString("it-IT")}
                          </span>
                        )}
                        {e.metadati.stato && (
                          <span className="text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Stato: {e.metadati.stato}
                          </span>
                        )}
                        {e.metadati.scadenza && (
                          <span className="text-rose-400 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            Scadenza: {e.metadati.scadenza}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-500">
                Nessun evento registrato per questo filtro.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
