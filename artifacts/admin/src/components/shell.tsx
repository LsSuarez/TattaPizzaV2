import { Link, useLocation } from "wouter";
import { PieChart, ListOrdered, UtensilsCrossed, Users, Store } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: PieChart },
  { href: "/orders", label: "Orders Board", icon: ListOrdered },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/customers", label: "Customers", icon: Users },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
          <div className="bg-primary text-primary-foreground p-2 rounded-md">
            <Store size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Tata Pizza</h1>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <item.icon size={20} className={isActive ? "text-primary" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border/50 text-xs text-sidebar-foreground/50 text-center">
          Operations Control
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
