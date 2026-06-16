import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  Calendar,
  FileSpreadsheet,
  BarChart3,
  Briefcase,
  CheckSquare,
  Settings,
  Zap,
  Rocket,
  ShieldCheck,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useGetChatInbox, useGetCurrentUser, useLogout } from "@workspace/api-client-react";
import { clearAuthSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";

type StaffRole = "admin" | "manager" | "staff";

const roleRank: Record<StaffRole, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
};

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: inbox } = useGetChatInbox();
  const { data: user } = useGetCurrentUser();
  const logout = useLogout();
  
  const unreadCount = inbox?.reduce((sum, entry) => sum + (entry.non_letti || 0), 0) || 0;
  const userRole = (user?.ruolo || "staff") as StaffRole;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: "staff" },
    { href: "/inbox", label: "Inbox", icon: MessageSquare, badge: unreadCount, minRole: "staff" },
    { href: "/contatti", label: "Contatti", icon: Users, minRole: "staff" },
    { href: "/preventivi", label: "Preventivi", icon: FileText, minRole: "staff" },
    { href: "/reports", label: "Marginalita", icon: BarChart3, minRole: "manager" },
    { href: "/agenda", label: "Agenda", icon: Calendar, minRole: "staff" },
    { href: "/agenda/importa-numbers", label: "Importa Eventi", icon: FileSpreadsheet, minRole: "manager" },
    { href: "/task", label: "Task", icon: CheckSquare, minRole: "staff" },
    { href: "/automazioni", label: "Automazioni", icon: Zap, minRole: "manager" },
    { href: "/b2b-competitor", label: "B2B", icon: Briefcase, minRole: "manager" },
    { href: "/go-live", label: "Go-live", icon: Rocket, minRole: "admin" },
    { href: "/audit-log", label: "Audit Log", icon: ShieldCheck, minRole: "admin" },
    { href: "/impostazioni", label: "Impostazioni", icon: Settings, minRole: "manager" },
  ] satisfies Array<{ href: string; label: string; icon: typeof LayoutDashboard; badge?: number; minRole: StaffRole }>;

  const visibleNavItems = navItems.filter((item) => roleRank[userRole] >= roleRank[item.minRole]);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      clearAuthSession();
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background overflow-hidden font-sans">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar text-sidebar-foreground z-40 flex-shrink-0">
        <div>
          <h1 className="font-bold text-sm">Zak Ecosystem</h1>
          <p className="text-[10px] opacity-70">Sala Operativa</p>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar (Desktop & Mobile Overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full lg:z-auto
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Zak Ecosystem</h1>
            <p className="text-sm text-sidebar-foreground/70">Sala Operativa</p>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links - Scrollable for many items */}
        <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)] lg:max-h-none">
          {visibleNavItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
          <div className="border-t border-sidebar-border pt-4 mt-4">
            <div className="px-3 pb-2 text-xs text-sidebar-foreground/70">
              <p className="font-semibold text-sidebar-foreground">{user?.nome || "Staff"}</p>
              <p>{user?.email}</p>
              <p className="uppercase tracking-wide">{userRole}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              onClick={() => void handleLogout()}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </nav>
      </aside>

      {/* Backdrop overlay for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>

    </div>
  );
}
