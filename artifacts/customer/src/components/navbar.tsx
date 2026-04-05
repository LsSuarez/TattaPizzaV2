import { Link, useLocation } from "wouter";
import { ShoppingCart, User, ClipboardList, Menu, X, Pizza, MapPin } from "lucide-react";
import { useState } from "react";
import { Show, useUser, useClerk } from "@clerk/react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { itemCount } = useCart();
  const { user } = useUser();
  const { signOut } = useClerk();

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  const navLinks = [
    { href: "/menu", label: "Menú", icon: Pizza },
    { href: "/mis-pedidos", label: "Mis Pedidos", icon: ClipboardList, auth: true },
    { href: "/perfil", label: "Mi Perfil", icon: User, auth: true },
  ];

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/menu" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Pizza className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block">Tata Pizza</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, auth }) => {
              if (auth) {
                return (
                  <Show key={href} when="signed-in">
                    <Link
                      href={href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(href)
                          ? "bg-primary text-white"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {label}
                    </Link>
                  </Show>
                );
              }
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-primary text-white"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Show when="signed-in">
              <Link href="/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>
            </Show>

            {/* Auth buttons */}
            <Show when="signed-out">
              <a href={`${basePath}/sign-in`} className="text-sm font-medium text-primary hover:underline hidden sm:block">
                Iniciar sesión
              </a>
              <a
                href={`${basePath}/sign-up`}
                className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors hidden sm:block"
              >
                Registrarse
              </a>
            </Show>

            <Show when="signed-in">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user?.firstName ?? "Hola"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ redirectUrl: `${basePath}/` })}
                  className="text-sm"
                >
                  Salir
                </Button>
              </div>
            </Show>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon, auth }) => {
              const el = (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href) ? "bg-primary text-white" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
              if (auth) return <Show key={href} when="signed-in">{el}</Show>;
              return el;
            })}
            <Show when="signed-out">
              <a
                href={`${basePath}/sign-in`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted"
              >
                <User className="w-4 h-4" />
                Iniciar sesión
              </a>
              <a
                href={`${basePath}/sign-up`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white text-sm font-medium"
              >
                Registrarse
              </a>
            </Show>
            <Show when="signed-in">
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted"
              >
                <ShoppingCart className="w-4 h-4" />
                Carrito {itemCount > 0 && <span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">{itemCount}</span>}
              </Link>
              <Link
                href="/direcciones"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted"
              >
                <MapPin className="w-4 h-4" />
                Mis Direcciones
              </Link>
              <button
                onClick={() => { setOpen(false); signOut({ redirectUrl: `${basePath}/` }); }}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-muted"
              >
                Cerrar sesión
              </button>
            </Show>
          </div>
        )}
      </div>
    </nav>
  );
}
