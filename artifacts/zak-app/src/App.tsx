import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Inbox from "@/pages/inbox";
import Contatti from "@/pages/contatti";
import ContattiNuovo from "@/pages/contatti-nuovo";
import Preventivi from "@/pages/preventivi";
import Agenda from "@/pages/agenda";
import Impostazioni from "@/pages/impostazioni";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/contatti/nuovo" component={ContattiNuovo} />
      <Route path="/contatti" component={Contatti} />
      <Route path="/preventivi" component={Preventivi} />
      <Route path="/agenda" component={Agenda} />
      <Route path="/impostazioni" component={Impostazioni} />
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
