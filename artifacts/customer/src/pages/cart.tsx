import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { useCart } from "@/lib/cart";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { items, total, updateQty, removeItem, clear } = useCart();
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = (menuItemId: number, size: string | null) => {
    const key = `${menuItemId}-${size}`;
    setRemoving(key);
    setTimeout(() => {
      removeItem(menuItemId, size);
      setRemoving(null);
    }, 300);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold mb-3">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-8">Agrega pizzas deliciosas desde nuestro menú</p>
          <Link href="/menu">
            <Button className="bg-primary text-white rounded-xl px-8 py-3">Ver el Menú</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🛒 Tu Carrito</h1>
          <button
            onClick={() => { if (confirm("¿Vaciar carrito?")) clear(); }}
            className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Vaciar
          </button>
        </div>

        <div className="space-y-3 mb-8">
          {items.map((item) => {
            const key = `${item.menuItemId}-${item.size}`;
            const isRemoving = removing === key;
            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border border-border p-4 flex items-center gap-4 transition-all ${isRemoving ? "opacity-0 scale-95" : "opacity-100"}`}
              >
                <div className="text-3xl bg-primary/5 rounded-xl w-14 h-14 flex items-center justify-center shrink-0">
                  🍕
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.sizeLabel && item.sizeLabel !== "Única" ? item.sizeLabel : ""}
                    {" · "}S/.{(item.unitPrice / 100).toFixed(0)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.menuItemId, item.size, item.quantity - 1)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.menuItemId, item.size, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right shrink-0 w-20">
                  <div className="font-bold text-primary">
                    S/.{((item.unitPrice * item.quantity) / 100).toFixed(0)}
                  </div>
                  <button
                    onClick={() => handleRemove(item.menuItemId, item.size)}
                    className="text-muted-foreground hover:text-destructive transition-colors mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Resumen del Pedido
          </h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={`${item.menuItemId}-${item.size}`} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.name}
                  {item.sizeLabel && item.sizeLabel !== "Única" ? ` (${item.sizeLabel})` : ""}
                </span>
                <span>S/.{((item.unitPrice * item.quantity) / 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-2xl text-primary">S/.{(total / 100).toFixed(0)}</span>
          </div>
          <Button
            onClick={() => setLocation("/checkout")}
            className="w-full mt-4 bg-primary text-white rounded-xl py-3 text-base font-semibold flex items-center justify-center gap-2"
          >
            Ir al pago
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Link href="/menu">
            <Button variant="ghost" className="w-full mt-2 text-muted-foreground">
              Seguir comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
