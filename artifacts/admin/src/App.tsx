import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import OrdersPage from "@/pages/orders";
import MenuPage from "@/pages/menu";
import CustomersPage from "@/pages/customers";
import CocinaPage from "@/pages/cocina";
import RepartidorPage from "@/pages/repartidor";
import CajaPage from "@/pages/caja";
import { Shell } from "@/components/shell";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Standalone role views — no sidebar */}
      <Route path="/cocina" component={CocinaPage} />
      <Route path="/repartidor" component={RepartidorPage} />
      {/* Admin views — with sidebar */}
      <Route>
        <Shell>
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/orders" component={OrdersPage} />
            <Route path="/menu" component={MenuPage} />
            <Route path="/customers" component={CustomersPage} />
            <Route path="/caja" component={CajaPage} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </Route>
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
