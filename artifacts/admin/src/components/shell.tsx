import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ListOrdered, UtensilsCrossed, Users, Pizza,
  ChefHat, Bike, ExternalLink, Wallet
} from "lucide-react";

const navItems = [
  { href: "/",          label: "Dashboard",       icon: LayoutDashboard },
  { href: "/orders",    label: "Pedidos",          icon: ListOrdered },
  { href: "/menu",      label: "Menú",             icon: UtensilsCrossed },
  { href: "/customers", label: "Clientes",         icon: Users },
  { href: "/caja",      label: "Cuadre de Caja",   icon: Wallet },
];

const roleLinks = [
  { href: "/cocina",     label: "Vista Cocina",      icon: ChefHat, accent: "text-orange-400 hover:bg-orange-500/10" },
  { href: "/repartidor", label: "Vista Repartidor",  icon: Bike,    accent: "text-blue-400 hover:bg-blue-500/10" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/30 shrink-0">
            <Pizza size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight truncate">Tata Pizza</h1>
            <p className="text-[11px] text-slate-400 truncate">Administración</p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 pb-2 pt-1">Principal</p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  isActive
                    ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}

          {/* Role views */}
          <div className="pt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 pb-2">Vistas por Rol</p>
            {roleLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${item.accent}`}
              >
                <item.icon size={17} />
                {item.label}
                <ExternalLink size={11} className="ml-auto opacity-50" />
              </Link>
            ))}
          </div>
        </nav>

        {/* Status bar */}
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
            Sistema operativo
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 max-w-full min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
