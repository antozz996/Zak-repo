import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  MessageSquare,
  Calendar,
  User,
  Wifi,
  Battery,
  ChevronRight,
  Bell,
  Search,
  Zap
} from "lucide-react";

export default function DashboardMobilePolish() {
  const [activeTab, setActiveTab] = useState<"home" | "inbox" | "calendar" | "profile">("home");

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex items-center justify-center p-4 font-[Inter,system-ui,sans-serif]">
      {/* Device Wrapper */}
      <div className="w-[375px] h-[812px] bg-[#1c1917] rounded-[48px] shadow-2xl border-[8px] border-stone-800 relative flex flex-col justify-between overflow-hidden select-none">
        
        {/* Device Notch & Status Bar */}
        <div className="bg-[#0c0a09] h-10 px-6 pt-3 flex items-center justify-between shrink-0 text-[11px] font-semibold text-stone-300">
          <span>9:41</span>
          <div className="w-14 h-4 bg-stone-900 rounded-full border border-stone-800" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Top Header */}
        <header className="px-5 py-3 flex items-center justify-between border-b border-stone-800 shrink-0 bg-[#1c1917]/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/20 font-bold text-sm">
              Z
            </div>
            <div>
              <h2 className="text-xs font-bold leading-none">Villa ZAK</h2>
              <span className="text-[10px] text-stone-400">Milano Events</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 bg-stone-800 rounded-full hover:bg-stone-700">
              <Bell className="w-3.5 h-3.5 text-stone-300" />
            </button>
          </div>
        </header>

        {/* Main Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-[#0c0a09]/30">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/10 border border-orange-500/20 rounded-2xl p-4 space-y-1.5 relative overflow-hidden">
            <span className="text-[9px] uppercase font-bold text-orange-400 tracking-wider">Sala Operativa Mobile</span>
            <h3 className="text-sm font-bold text-stone-100">Benvenuto, Alessandro</h3>
            <p className="text-[10px] text-stone-400">Le performance commerciali della venue sono in linea con i target.</p>
            <Zap className="absolute right-4 bottom-2 w-16 h-16 text-orange-500/10 shrink-0" />
          </div>

          {/* Compact KPIs - Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Revenue KPI */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center">
                  +12.4%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 font-semibold uppercase">Fatturato</span>
                <p className="text-base font-bold text-stone-100 mt-0.5">€125.400</p>
              </div>
            </div>

            {/* Leads KPI */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-1 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full flex items-center">
                  +8.2%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 font-semibold uppercase">Nuovi Lead</span>
                <p className="text-base font-bold text-stone-100 mt-0.5">452 contatti</p>
              </div>
            </div>

            {/* Quotes KPI */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full flex items-center">
                  -2.1%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 font-semibold uppercase">Preventivi</span>
                <p className="text-base font-bold text-stone-100 mt-0.5">89 attivi</p>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full flex items-center">
                  +5.4%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 font-semibold uppercase">Tasso Conv.</span>
                <p className="text-base font-bold text-stone-100 mt-0.5">18.4%</p>
              </div>
            </div>
          </div>

          {/* Premium Custom SVG Chart */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-200">Weekly Performance</h4>
                <p className="text-[9px] text-stone-400">Fatturato stimato negli ultimi 7 giorni</p>
              </div>
            </div>
            {/* SVG line chart */}
            <div className="h-28 w-full flex items-end">
              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area path */}
                <path
                  d="M0,100 L0,70 L50,55 L100,75 L150,45 L200,30 L250,50 L300,15 L300,100 Z"
                  fill="url(#chartGrad)"
                />
                {/* Stroke line path */}
                <path
                  d="M0,70 L50,55 L100,75 L150,45 L200,30 L250,50 L300,15"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Dots on points */}
                <circle cx="0" cy="70" r="3.5" fill="#ea580c" />
                <circle cx="50" cy="55" r="3.5" fill="#ea580c" />
                <circle cx="100" cy="75" r="3.5" fill="#ea580c" />
                <circle cx="150" cy="45" r="3.5" fill="#ea580c" />
                <circle cx="200" cy="30" r="3.5" fill="#ea580c" />
                <circle cx="250" cy="50" r="3.5" fill="#ea580c" />
                <circle cx="300" cy="15" r="3.5" fill="#ea580c" />
              </svg>
            </div>
            {/* Weekdays Labels */}
            <div className="flex justify-between text-[8px] text-stone-500 font-bold px-1 uppercase tracking-wider">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mer</span>
              <span>Gio</span>
              <span>Ven</span>
              <span>Sab</span>
              <span>Dom</span>
            </div>
          </div>

          {/* Quick Activity Feed */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-stone-200">Ultimi Eventi Venue</h4>
            <div className="space-y-3 text-[10px]">
              <div className="flex justify-between items-start border-b border-stone-800 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-stone-200">Compleanno Marco Rossi</p>
                  <p className="text-stone-400 mt-0.5">Stato: Confermato | Invitati: 120</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
              </div>
              <div className="flex justify-between items-start border-b border-stone-800 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-stone-200">Laurea Giulia Bianchi</p>
                  <p className="text-stone-400 mt-0.5">Stato: Opzionato | Budget: €4.5k</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
              </div>
              <div className="flex justify-between items-start border-b border-stone-800 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-stone-200">Matrimonio Luxury S&A</p>
                  <p className="text-stone-400 mt-0.5">Stato: Opzionato | Data: 28 Giu 2026</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
              </div>
            </div>
          </div>

        </main>

        {/* Bottom Navigation Bar */}
        <footer className="bg-[#1c1917] border-t border-stone-800 h-16 px-6 pb-2 flex items-center justify-between shrink-0">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase transition-colors ${
              activeTab === "home" ? "text-orange-500" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase transition-colors relative ${
              activeTab === "inbox" ? "text-orange-500" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Inbox</span>
            <span className="absolute -top-1 -right-2 bg-orange-600 text-stone-100 text-[8px] px-1 rounded-full scale-90">
              3
            </span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase transition-colors ${
              activeTab === "calendar" ? "text-orange-500" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase transition-colors ${
              activeTab === "profile" ? "text-orange-500" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profilo</span>
          </button>
        </footer>

        {/* Home Indicator */}
        <div className="bg-[#1c1917] h-6 flex justify-center shrink-0">
          <div className="w-32 h-1 bg-stone-700 rounded-full mt-1.5" />
        </div>

      </div>
    </div>
  );
}
