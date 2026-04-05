import { Link, useLocation } from "wouter";
import { PieChart, ListOrdered, UtensilsCrossed, Users, Pizza, ChefHat, Bike, ExternalLink } from "lucide-react";

const navItems = [
  { href: "/",          label: "Dashboard",     icon: PieChart },
  { href: "/orders",    label: "Pedidos",        icon: ListOrdered },
  { href: "/menu",      label: "Menú",           icon: UtensilsCrossed },
  { href: "/customers", label: "Clientes",       icon: Users },
];

const roleLinks = [
  { href: "/cocina",     label: "Vista Cocina",     icon: ChefHat,  color: "text-orange-400" },
  { href: "/repartidor", label: "Vista Repartidor",  icon: Bike,     color: "text-blue-400" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-gray-800">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/30">
            <Pizza size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Tata Pizza</h1>
            <p className="text-xs text-gray-400">Panel de administración</p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-3 pb-2">Principal</p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <item.icon size={18} className={isActive ? "text-white" : ""} />
                {item.label}
              </Link>
            );
          })}

          {/* Role views */}
          <div className="pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-3 pb-2">Vistas por Rol</p>
            {roleLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-gray-400 hover:bg-gray-800 hover:text-white ${item.color}`}
              >
                <item.icon size={18} />
                {item.label}
                <ExternalLink size={12} className="ml-auto opacity-50" />
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Sistema operativo
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
