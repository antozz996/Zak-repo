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
import Agenda from "@/pages/agenda";
import Task from "@/pages/task";
import Impostazioni from "@/pages/impostazioni";
import Automazioni from "@/pages/automazioni";
import AuditLog from "@/pages/audit-log";
import B2BCompetitor from "@/pages/b2b-competitor";
import PreventivoPDFPreview from "@/pages/preventivo-pdf-preview";
import AdminRoles from "@/pages/admin-roles";
import Login from "@/pages/login";
import LoginMock from "@/pages/login-mock";
import AccessDeniedMock from "@/pages/access-denied-mock";
import SecurityAuditMock from "@/pages/security-audit-mock";
import RealtimeInboxMock from "@/pages/realtime-inbox-mock";
import LlmBookingReviewMock from "@/pages/llm-booking-review-mock";
import PreventivoPricingBuilderMock from "@/pages/preventivo-pricing-builder-mock";
import PreventivoSignatureMock from "@/pages/preventivo-signature-mock";
import GoogleCalendarSettingsMock from "@/pages/google-calendar-settings-mock";

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
      <Route path="/dashboard">{withAuth(<Dashboard />)}</Route>
      <Route path="/inbox">{withAuth(<Inbox />)}</Route>
      <Route path="/contatti/nuovo">{withAuth(<ContattiNuovo />)}</Route>
      <Route path="/contatti">{withAuth(<Contatti />)}</Route>
      <Route path="/preventivi">{withAuth(<Preventivi />)}</Route>
      <Route path="/agenda">{withAuth(<Agenda />)}</Route>
      <Route path="/task">{withAuth(<Task />)}</Route>
      <Route path="/impostazioni">{withAuth(<Impostazioni />, "manager")}</Route>
      <Route path="/automazioni">{withAuth(<Automazioni />, "manager")}</Route>
      <Route path="/audit-log">{withAuth(<AuditLog />, "admin")}</Route>
      <Route path="/b2b-competitor">{withAuth(<B2BCompetitor />, "manager")}</Route>
      <Route path="/preventivo-pdf-preview">{withAuth(<PreventivoPDFPreview />)}</Route>
      <Route path="/admin-roles">{withAuth(<AdminRoles />, "admin")}</Route>
      <Route path="/login-mock">{withAuth(<LoginMock />)}</Route>
      <Route path="/access-denied-mock">{withAuth(<AccessDeniedMock />)}</Route>
      <Route path="/security-audit-mock">{withAuth(<SecurityAuditMock />, "admin")}</Route>
      <Route path="/realtime-inbox-mock">{withAuth(<RealtimeInboxMock />)}</Route>
      <Route path="/llm-booking-review-mock">{withAuth(<LlmBookingReviewMock />, "manager")}</Route>
      <Route path="/preventivo-pricing-builder-mock">{withAuth(<PreventivoPricingBuilderMock />, "manager")}</Route>
      <Route path="/preventivo-signature-mock">{withAuth(<PreventivoSignatureMock />)}</Route>
      <Route path="/google-calendar-settings-mock">{withAuth(<GoogleCalendarSettingsMock />, "manager")}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
