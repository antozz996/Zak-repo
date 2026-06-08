import { useState } from "react";
import {
  Shield,
  Users,
  UserPlus,
  Settings,
  Lock,
  Check,
  Search,
  CheckSquare,
  Square,
  ChevronRight,
  Info,
  Trash2,
} from "lucide-react";

interface UserAccount {
  id: number;
  nome: string;
  email: string;
  ruolo: "admin" | "manager" | "staff";
  stato: "attivo" | "disattivato";
  ultimoAccesso: string;
}

const initialUsers: UserAccount[] = [
  { id: 1, nome: "Alessandro Rossi", email: "alessandro.rossi@villazak.com", ruolo: "admin", stato: "attivo", ultimoAccesso: "Oggi 14:15" },
  { id: 2, nome: "Giuseppe Esposito", email: "giuseppe.esposito@villazak.com", ruolo: "manager", stato: "attivo", ultimoAccesso: "Oggi 11:30" },
  { id: 3, nome: "Chiara Ferrari", email: "chiara.ferrari@villazak.com", ruolo: "staff", stato: "attivo", ultimoAccesso: "Ieri 18:22" },
  { id: 4, nome: "Roberto Martini", email: "roberto.martini@villazak.com", ruolo: "staff", stato: "attivo", ultimoAccesso: "30 Mag" },
  { id: 5, nome: "Valeria Conte", email: "valeria.conte@villazak.com", ruolo: "staff", stato: "disattivato", ultimoAccesso: "25 Mag" },
];

interface Permesso {
  chiave: string;
  descrizione: string;
  categoria: "vendite" | "operatività" | "sistema";
  admin: boolean;
  manager: boolean;
  staff: boolean;
}

const initialPermissions: Permesso[] = [
  { chiave: "dashboard.view", descrizione: "Visualizzazione Dashboard Executive", categoria: "vendite", admin: true, manager: true, staff: false },
  { chiave: "quote.manage", descrizione: "Creazione e Modifica Preventivi", categoria: "vendite", admin: true, manager: true, staff: false },
  { chiave: "inbox.write", descrizione: "Risposta manuale e Presa in Carico Chat", categoria: "operatività", admin: true, manager: true, staff: true },
  { chiave: "inbox.pause_ai", descrizione: "Mettere in pausa o Avviare il bot AI", categoria: "operatività", admin: true, manager: true, staff: true },
  { chiave: "automation.manage", descrizione: "Attivazione e Configurazione Automazioni CRM", categoria: "sistema", admin: true, manager: true, staff: false },
  { chiave: "system.settings", descrizione: "Modifica Integrazioni (Meta, Vapi, Google Sync)", categoria: "sistema", admin: true, manager: false, staff: false },
];

export default function AdminRoles() {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [permissions, setPermissions] = useState<Permesso[]>(initialPermissions);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "manager" | "staff">("staff");

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const togglePermission = (permKey: string, role: "admin" | "manager" | "staff") => {
    setPermissions(permissions.map(p => {
      if (p.chiave === permKey) {
        return {
          ...p,
          [role]: !p[role]
        };
      }
      return p;
    }));
    showNotification("Permessi aggiornati con successo.");
  };

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: UserAccount = {
      id: Date.now(),
      nome: newUserName,
      email: newUserEmail,
      ruolo: newUserRole,
      stato: "attivo",
      ultimoAccesso: "Mai effettuato",
    };

    setUsers([...users, newUser]);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("staff");
    setShowAddUserModal(false);
    showNotification(`Utente ${newUserName} invitato con successo.`);
  };

  const toggleUserStatus = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const nuovoStato = u.stato === "attivo" ? "disattivato" : "attivo";
        showNotification(`Stato utente aggiornato a: ${nuovoStato}`);
        return { ...u, stato: nuovoStato as any };
      }
      return u;
    }));
  };

  const filteredUsers = users.filter(u => 
    `${u.nome} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleClassMap = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
    manager: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    staff: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[Inter,system-ui,sans-serif] pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Amministrazione Ruoli & Permessi
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Controllo degli accessi ed audit log di sicurezza</p>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Nuovo Utente Staff
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Users List (6 Cols) */}
        <section className="lg:col-span-6 space-y-4">
          
          {/* Notification banner */}
          {notification && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-emerald-400 font-semibold animate-fade-in flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          )}

          {/* User management list */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-violet-400" />
                Utenti Registrati nella Venue
              </h3>
              
              {/* Search bar */}
              <div className="relative w-full sm:w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Cerca utente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl focus:outline-none focus:border-violet-500/40"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3 px-2">Operatore</th>
                    <th className="pb-3 px-2">Ruolo</th>
                    <th className="pb-3 px-2">Stato</th>
                    <th className="pb-3 px-2 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`border-b border-white/[0.04] text-xs hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        selectedUserId === u.id ? "bg-white/[0.03]" : ""
                      }`}
                    >
                      <td className="py-3 px-2">
                        <p className="font-semibold text-white">{u.nome}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{u.email}</p>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${roleClassMap[u.ruolo]}`}>
                          {u.ruolo}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[10px] font-semibold ${u.stato === "attivo" ? "text-emerald-400" : "text-gray-500"}`}>
                          {u.stato}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserStatus(u.id);
                          }}
                          className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg transition-colors"
                        >
                          {u.stato === "attivo" ? "Disabilita" : "Abilita"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Side: Permissions Matrix / Detail Drawer (6 Cols) */}
        <section className="lg:col-span-6 space-y-4">
          
          {/* Permission matrix configuration */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-violet-400" />
                Matrice dei Permessi per Ruolo
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">Definizione dei permessi globali assegnati ai ruoli di sistema.</p>
            </div>

            <div className="space-y-4">
              {permissions.map((p) => (
                <div key={p.chiave} className="border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{p.descrizione}</p>
                      <span className="text-[9px] font-bold bg-white/[0.04] text-gray-400 border border-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                        {p.categoria}
                      </span>
                    </div>
                  </div>

                  {/* Toggle buttons for each role */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Admin toggle */}
                    <button
                      onClick={() => togglePermission(p.chiave, "admin")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                        p.admin
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-white/[0.02] border-white/[0.04] text-gray-500"
                      }`}
                    >
                      Admin {p.admin ? "✓" : "✗"}
                    </button>
                    
                    {/* Manager toggle */}
                    <button
                      onClick={() => togglePermission(p.chiave, "manager")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                        p.manager
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-white/[0.02] border-white/[0.04] text-gray-500"
                      }`}
                    >
                      Manager {p.manager ? "✓" : "✗"}
                    </button>

                    {/* Staff toggle */}
                    <button
                      onClick={() => togglePermission(p.chiave, "staff")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                        p.staff
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-white/[0.02] border-white/[0.04] text-gray-500"
                      }`}
                    >
                      Staff {p.staff ? "✓" : "✗"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Invite user modal (Simulated overlay) */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-gray-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-400" />
              Invita Nuovo Collaboratore
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-400 uppercase text-[9px]">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Es. Chiara Romano"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-400 uppercase text-[9px]">Indirizzo Email</label>
                <input
                  type="email"
                  placeholder="email@azienda.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-400 uppercase text-[9px]">Ruolo Assegnato</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/[0.08] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none"
                >
                  <option value="staff">Staff (Operatore)</option>
                  <option value="manager">Venue Manager</option>
                  <option value="admin">Amministratore (Admin)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all"
              >
                Invia Invito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
