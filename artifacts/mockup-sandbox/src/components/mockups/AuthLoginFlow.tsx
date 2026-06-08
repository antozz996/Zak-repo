import { useState } from "react";
import {
  Lock,
  User,
  Shield,
  AlertTriangle,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

export default function AuthLoginFlow() {
  const [activeTab, setActiveTab] = useState<
    "login" | "error_cred" | "expired" | "suspended" | "denied" | "roles"
  >("login");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginState, setLoginState] = useState<"idle" | "success" | "error">("idle");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "staff@villazak.com" && password === "password123") {
      setLoginState("success");
    } else {
      setLoginState("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      {/* Top Selector Bar */}
      <div className="w-full max-w-4xl bg-slate-800 p-3 rounded-xl mb-8 flex flex-wrap gap-2 justify-center border border-slate-700">
        <button
          onClick={() => {
            setActiveTab("login");
            setLoginState("idle");
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "login"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          }`}
        >
          Form Login
        </button>
        <button
          onClick={() => setActiveTab("error_cred")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "error_cred"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          }`}
        >
          Errore Credenziali
        </button>
        <button
          onClick={() => setActiveTab("expired")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "expired"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          }`}
        >
          Sessione Scaduta
        </button>
        <button
          onClick={() => setActiveTab("suspended")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "suspended"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          }`}
        >
          Account Sospeso
        </button>
        <button
          onClick={() => setActiveTab("denied")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "denied"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          }`}
        >
          Access Denied
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "roles"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          }`}
        >
          Confronto Ruoli
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md flex-grow flex items-center justify-center">
        {/* VIEW 1: LOGIN FORM */}
        {activeTab === "login" && (
          <div className="w-full bg-slate-800/90 border border-slate-700 p-8 rounded-2xl shadow-2xl backdrop-blur-sm space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Accedi a ZAK</h2>
              <p className="text-slate-400 text-xs mt-1">
                Usa `staff@villazak.com` / `password123` per il test.
              </p>
            </div>

            {loginState === "success" && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Accesso autorizzato! Reindirizzamento in corso...</span>
              </div>
            )}

            {loginState === "error" && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>Credenziali non valide o non autorizzate.</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                  Indirizzo Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="email@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => e.preventDefault()}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Hai dimenticato la password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <label htmlFor="remember" className="text-slate-400 text-[10px] select-none">
                    Rimani connesso
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                Accedi al Pannello
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: ERRORE CREDENZIALI */}
        {activeTab === "error_cred" && (
          <div className="w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">Credenziali non valide</h3>
              <p className="text-slate-400 text-xs">
                L'indirizzo email inserito o la password non corrispondono ad alcun utente registrato nel sistema.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl text-left text-[10px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px] block">
                Cosa fare:
              </span>
              <p>1. Verifica l'inserimento di lettere maiuscole e simboli.</p>
              <p>2. Assicurati che l'account non sia stato disattivato dall'admin.</p>
            </div>
            <button
              onClick={() => setActiveTab("login")}
              className="w-full bg-slate-700 hover:bg-slate-650 text-slate-100 font-bold py-2 text-xs rounded-lg transition-colors"
            >
              Riprova
            </button>
          </div>
        )}

        {/* VIEW 3: SESSIONE SCADUTA */}
        {activeTab === "expired" && (
          <div className="w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">Sessione Scaduta</h3>
              <p className="text-slate-400 text-xs">
                Per motivi di sicurezza la tua sessione e' scaduta dopo 12 ore di attivita'. E' necessario autenticarsi di nuovo.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("login")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs rounded-lg transition-colors"
            >
              Ricollegati Ora
            </button>
          </div>
        )}

        {/* VIEW 4: ACCOUNT SOSPESO */}
        {activeTab === "suspended" && (
          <div className="w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">Account Disattivato</h3>
              <p className="text-slate-400 text-xs">
                Il tuo utente e' stato contrassegnato come disattivato. L'accesso al sistema ZAK e' bloccato.
              </p>
            </div>
            <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-left text-[10px] text-rose-300">
              Se ritieni che si tratti di un errore, contatta l'Amministratore della Venue per richiedere l'abilitazione delle tue credenziali.
            </div>
            <button
              onClick={() => setActiveTab("login")}
              className="w-full bg-slate-700 hover:bg-slate-650 text-slate-400 font-bold py-2 text-xs rounded-lg transition-colors cursor-not-allowed"
              disabled
            >
              Accesso Non Consentito
            </button>
          </div>
        )}

        {/* VIEW 5: ACCESS DENIED */}
        {activeTab === "denied" && (
          <div className="w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100 text-rose-400">Accesso Negato</h3>
              <p className="text-slate-400 text-xs">
                Il tuo ruolo corrente (Staff) non dispone dei privilegi necessari per visualizzare questa pagina.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl text-[10px] text-left text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Pagina richiesta:</span>
                <span className="font-bold text-slate-400">/automazioni-crm</span>
              </div>
              <div className="flex justify-between">
                <span>Ruolo richiesto:</span>
                <span className="font-bold text-indigo-400">Manager o superiore</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("login")}
                className="flex-1 bg-slate-700 hover:bg-slate-650 text-slate-100 font-bold py-2 text-xs rounded-lg transition-colors"
              >
                Cambia Account
              </button>
              <button
                onClick={() => alert("Simulazione ritorno alla Dashboard")}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs rounded-lg transition-colors"
              >
                Vai alla Dashboard
              </button>
            </div>
          </div>
        )}

        {/* VIEW 6: CONFRONTO RUOLI */}
        {activeTab === "roles" && (
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Users className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold">Matrice Privilegi ZAK</h3>
            </div>
            <div className="space-y-3 text-[11px]">
              {/* Admin Card */}
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-400 uppercase text-[9px] tracking-wider">
                    Admin
                  </span>
                  <span className="text-[8px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded font-semibold">
                    Controllo Totale
                  </span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Configura segreti, cambia ruoli, visualizza statistiche economiche, gestisce preventivi e messaggi.
                </p>
              </div>

              {/* Manager Card */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 uppercase text-[9px] tracking-wider">
                    Manager
                  </span>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                    Operativita' & Vendite
                  </span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Gestisce i preventivi, imposta le automazioni CRM, assegna i compiti ed approva le estrazioni AI.
                </p>
              </div>

              {/* Staff Card */}
              <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sky-400 uppercase text-[9px] tracking-wider">
                    Staff
                  </span>
                  <span className="text-[8px] bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded font-semibold">
                    Messaggi & Task
                  </span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Legge e risponde alle chat dell'Inbox, mette in pausa l'AI e spunta i task personali.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
