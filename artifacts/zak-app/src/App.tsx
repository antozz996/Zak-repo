import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { configureAuthTokenGetter } from "@/lib/auth-session";
import Dashboard from "@/pages/dashboard";
import Inbox from "@/pages/inbox";
import Contatti from "@/pages/contatti";
import ContattiNuovo from "@/pages/contatti-nuovo";
import Preventivi from "@/pages/preventivi";
import EventDetailPage from "@/pages/event-detail";
import Agenda from "@/pages/agenda";
import AgendaImportNumbers from "@/pages/agenda-import-numbers";
import Task from "@/pages/task";
import Impostazioni from "@/pages/impostazioni";
import Automazioni from "@/pages/automazioni";
import AuditLog from "@/pages/audit-log";
import B2BCompetitor from "@/pages/b2b-competitor";
import GoLive from "@/pages/go-live";
import Login from "@/pages/login";
import Reports from "@/pages/reports";
import PublicQuotePage from "@/pages/public-quote";

const queryClient = new QueryClient();
configureAuthTokenGetter();

const withAuth = (component: React.ReactNode, minimumRole: "admin" | "manager" | "staff" = "staff") => (
  <ProtectedRoute minimumRole={minimumRole}>{component}</ProtectedRoute>
);

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/condividi/:token" component={PublicQuotePage} />
      <Route path="/condividi/:token/" component={PublicQuotePage} />
      <Route path="/dashboard">{withAuth(<Dashboard />)}</Route>
      <Route path="/inbox">{withAuth(<Inbox />)}</Route>
      <Route path="/contatti/nuovo">{withAuth(<ContattiNuovo />)}</Route>
      <Route path="/contatti">{withAuth(<Contatti />)}</Route>
      <Route path="/preventivi">{withAuth(<Preventivi />)}</Route>
      <Route path="/events/:id">{withAuth(<EventDetailPage />)}</Route>
      <Route path="/reports">{withAuth(<Reports />, "manager")}</Route>
      <Route path="/agenda">{withAuth(<Agenda />)}</Route>
      <Route path="/agenda/importa-numbers">{withAuth(<AgendaImportNumbers />, "manager")}</Route>
      <Route path="/task">{withAuth(<Task />)}</Route>
      <Route path="/impostazioni">{withAuth(<Impostazioni />, "manager")}</Route>
      <Route path="/automazioni">{withAuth(<Automazioni />, "manager")}</Route>
      <Route path="/audit-log">{withAuth(<AuditLog />, "admin")}</Route>
      <Route path="/b2b-competitor">{withAuth(<B2BCompetitor />, "manager")}</Route>
      <Route path="/go-live">{withAuth(<GoLive />, "admin")}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
