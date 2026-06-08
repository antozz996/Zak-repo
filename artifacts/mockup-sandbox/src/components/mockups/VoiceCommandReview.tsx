import { useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  MessageSquareText,
  Mic2,
  PhoneCall,
  RotateCcw,
  UserRound,
  WandSparkles,
} from "lucide-react";

type IntentType = "task" | "agenda";

interface VoiceItem {
  id: number;
  contatto: string;
  telefono: string;
  transcript: string;
  intent: IntentType;
  confidence: number;
  outputTitle: string;
  outputDetail: string;
}

const calls: VoiceItem[] = [
  {
    id: 1,
    contatto: "Marco Rossi",
    telefono: "+39 333 1234567",
    transcript: "Ricordami di richiamare Marco domani mattina per chiudere il preventivo del compleanno.",
    intent: "task",
    confidence: 94,
    outputTitle: "Richiamare Marco Rossi",
    outputDetail: "Task urgente con scadenza domani mattina.",
  },
  {
    id: 2,
    contatto: "Giulia Bianchi",
    telefono: "+39 348 9876543",
    transcript: "Fissa appuntamento venerdi alle sedici con Giulia per parlare della festa di laurea.",
    intent: "agenda",
    confidence: 89,
    outputTitle: "Appuntamento con Giulia Bianchi",
    outputDetail: "Evento agenda venerdi alle 16:00.",
  },
  {
    id: 3,
    contatto: "Luca Verdi",
    telefono: "+39 320 5551234",
    transcript: "Segnati di verificare se a settembre abbiamo ancora disponibilita per matrimonio.",
    intent: "task",
    confidence: 81,
    outputTitle: "Verificare disponibilita settembre",
    outputDetail: "Task media priorita collegato al contatto.",
  },
];

function confidenceColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 80) return "bg-amber-500";
  return "bg-rose-500";
}

export default function VoiceCommandReview() {
  const [selected, setSelected] = useState<VoiceItem>(calls[0]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <Mic2 className="h-4 w-4" />
              Mockup sandbox - revisione voice command
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
              Trascrizioni telefoniche trasformate in task o agenda.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Prototipo per validare intenti, confidence e output prima di salvare comandi vocali nel CRM reale.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 p-5 text-slate-950">
            <Activity className="mb-5 h-7 w-7" />
            <p className="text-sm font-bold">Pipeline proposta</p>
            <p className="mt-2 text-3xl font-black">Voice {"->"} Review {"->"} CRM</p>
            <p className="mt-3 text-xs font-medium text-slate-800">
              Nessuna chiamata API: solo esperienza UI con dati fittizi.
            </p>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-3">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelected(call)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  selected.id === call.id
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-bold">
                    <PhoneCall className="h-4 w-4 text-cyan-300" />
                    {call.contatto}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-slate-400">{call.transcript}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {call.intent === "task" ? "Task" : "Agenda"}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {call.confidence}% confidence
                  </span>
                </div>
              </button>
            ))}
          </aside>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-black">{selected.outputTitle}</h2>
                <p className="mt-2 text-sm text-slate-400">{selected.outputDetail}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-right">
                <p className="text-xs text-slate-400">Confidence</p>
                <p className="text-3xl font-black">{selected.confidence}%</p>
                <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full ${confidenceColor(selected.confidence)}`} style={{ width: `${selected.confidence}%` }} />
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900 p-4">
                <UserRound className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-xs text-slate-500">Contatto</p>
                <p className="font-bold">{selected.contatto}</p>
                <p className="text-xs text-slate-400">{selected.telefono}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900 p-4">
                {selected.intent === "task" ? (
                  <ClipboardCheck className="mb-3 h-5 w-5 text-emerald-300" />
                ) : (
                  <CalendarDays className="mb-3 h-5 w-5 text-blue-300" />
                )}
                <p className="text-xs text-slate-500">Intento rilevato</p>
                <p className="font-bold">{selected.intent === "task" ? "Task personale" : "Evento agenda"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900 p-4">
                <WandSparkles className="mb-3 h-5 w-5 text-amber-300" />
                <p className="text-xs text-slate-500">Azione proposta</p>
                <p className="font-bold">{selected.intent === "task" ? "Crea task" : "Crea evento"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-cyan-300" />
                <h3 className="text-sm font-bold">Trascrizione</h3>
              </div>
              <p className="text-sm leading-7 text-slate-300">"{selected.transcript}"</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950">
                <Check className="h-4 w-4" />
                Approva output
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white">
                <RotateCcw className="h-4 w-4" />
                Cambia intento
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
