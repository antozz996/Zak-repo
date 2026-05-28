import { Link, useLocation } from "wouter";
import { LayoutDashboard, MessageSquare, Users, FileText, Calendar, Settings, Zap } from "lucide-react";
import { useGetChatInbox } from "@workspace/api-client-react";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: inbox } = useGetChatInbox();
  
  const unreadCount = inbox?.reduce((sum, entry) => sum + (entry.non_letti || 0), 0) || 0;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inbox", label: "Inbox", icon: MessageSquare, badge: unreadCount },
    { href: "/contatti", label: "Contatti", icon: Users },
    { href: "/preventivi", label: "Preventivi", icon: FileText },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/automazioni", label: "Automazioni", icon: Zap },
    { href: "/impostazioni", label: "Impostazioni", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-sidebar-foreground">Zak Ecosystem</h1>
          <p className="text-sm text-sidebar-foreground/70">Sala Operativa</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
