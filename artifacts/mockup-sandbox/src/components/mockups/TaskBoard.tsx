import { useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  ListChecks,
  Phone,
  Plus,
  Search,
  UserRound,
} from "lucide-react";

type TaskStatus = "aperto" | "urgente" | "completato";
type TaskPriority = "bassa" | "media" | "alta" | "urgente";

interface DemoTask {
  id: number;
  titolo: string;
  descrizione: string;
  stato: TaskStatus;
  priorita: TaskPriority;
  fonte: "manuale" | "voice";
  contatto: string;
  scadenza: string;
}

const tasks: DemoTask[] = [
  {
    id: 1,
    titolo: "Richiamare Marco Rossi",
    descrizione: "Follow-up compleanno 30 anni e verifica budget.",
    stato: "urgente",
    priorita: "urgente",
    fonte: "voice",
    contatto: "Marco Rossi",
    scadenza: "Oggi 16:30",
  },
  {
    id: 2,
    titolo: "Preparare preventivo laurea",
    descrizione: "Proposta open bar per Giulia Bianchi, 80 persone.",
    stato: "aperto",
    priorita: "alta",
    fonte: "manuale",
    contatto: "Giulia Bianchi",
    scadenza: "Domani 12:00",
  },
  {
    id: 3,
    titolo: "Verificare menu vegano",
    descrizione: "Richiesta matrimonio civile dicembre.",
    stato: "aperto",
    priorita: "media",
    fonte: "manuale",
    contatto: "Chiara Romano",
    scadenza: "5 giugno",
  },
  {
    id: 4,
    titolo: "Controllare acconto convention",
    descrizione: "Verifica pagamento per evento aziendale.",
    stato: "urgente",
    priorita: "urgente",
    fonte: "manuale",
    contatto: "Pietro Santoro",
    scadenza: "Oggi 11:00",
  },
  {
    id: 5,
    titolo: "Inviare foto sala",
    descrizione: "Materiale fotografico per festa a sorpresa.",
    stato: "aperto",
    priorita: "bassa",
    fonte: "manuale",
    contatto: "Elena Marchetti",
    scadenza: "9 giugno",
  },
  {
    id: 6,
    titolo: "Aggiornare note contatto",
    descrizione: "Aggiunto tema Hollywood alla scheda cliente.",
    stato: "completato",
    priorita: "media",
    fonte: "manuale",
    contatto: "Sofia Pellegrini",
    scadenza: "Completato ieri",
  },
];

const columns: Array<{ id: TaskStatus; title: string; subtitle: string; accent: string }> = [
  { id: "aperto", title: "Aperti", subtitle: "Follow-up e cose da fare", accent: "from-sky-500 to-cyan-400" },
  { id: "urgente", title: "Urgenti", subtitle: "Da gestire subito", accent: "from-rose-500 to-orange-400" },
  { id: "completato", title: "Completati", subtitle: "Storico operativo", accent: "from-emerald-500 to-lime-400" },
];

const priorityClass: Record<TaskPriority, string> = {
  bassa: "bg-slate-100 text-slate-600",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-amber-100 text-amber-700",
  urgente: "bg-red-100 text-red-700",
};

function TaskCard({ task }: { task: DemoTask }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-950">{task.titolo}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{task.descrizione}</p>
        </div>
        {task.stato === "completato" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : task.priorita === "urgente" ? (
          <AlertCircle className="h-5 w-5 text-rose-500" />
        ) : (
          <Clock className="h-5 w-5 text-sky-500" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityClass[task.priorita]}`}>
          {task.priorita}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {task.fonte === "voice" ? "voice" : "manuale"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          {task.contatto}
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          {task.scadenza}
        </span>
      </div>
    </article>
  );
}

export default function TaskBoard() {
  const [query, setQuery] = useState("");
  const visibleTasks = tasks.filter((task) =>
    `${task.titolo} ${task.descrizione} ${task.contatto}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f4f1e8] p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                <ListChecks className="h-4 w-4" />
                Mockup sandbox - nessuna API reale
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
                Task Board operativo per follow-up, richiami e promemoria.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Prototipo visuale per capire come potrebbe evolvere la pagina task in una vista kanban rapida per lo staff.
              </p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg">
              <Plus className="h-4 w-4" />
              Nuovo task
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca task, cliente o nota..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <Filter className="h-4 w-4" />
            Priorita
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <Phone className="h-4 w-4" />
            Solo voice
          </button>
        </section>

        <main className="grid gap-5 lg:grid-cols-3">
          {columns.map((column) => {
            const columnTasks = visibleTasks.filter((task) => task.stato === column.id);
            return (
              <section key={column.id} className="rounded-[2rem] border border-slate-200 bg-white/60 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className={`mb-2 h-1.5 w-16 rounded-full bg-gradient-to-r ${column.accent}`} />
                    <h2 className="text-lg font-black text-slate-950">{column.title}</h2>
                    <p className="text-xs text-slate-500">{column.subtitle}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="grid gap-3">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
