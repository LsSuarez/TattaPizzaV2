import { Link } from "wouter";
import { Clock, Package, ChevronRight, Star, Repeat2 } from "lucide-react";
import Navbar from "@/components/navbar";
import { useGetMyOrders } from "@workspace/api-client-react";
import { type OrderWithItems } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  RECIBIDO: { label: "Recibido", color: "bg-blue-100 text-blue-700", icon: "📥" },
  EN_PREPARACION: { label: "En preparación", color: "bg-orange-100 text-orange-700", icon: "👨‍🍳" },
  LISTO: { label: "Listo", color: "bg-green-100 text-green-700", icon: "✅" },
  EN_CAMINO: { label: "En camino", color: "bg-purple-100 text-purple-700", icon: "🛵" },
  ENTREGADO: { label: "Entregado", color: "bg-gray-100 text-gray-600", icon: "🏠" },
};

function OrderCard({ order }: { order: OrderWithItems }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const status = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-muted text-muted-foreground", icon: "📦" };
  const date = new Date(order.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });

  const handleReorder = () => {
    order.items.forEach((item) => {
      addItem({
        menuItemId: item.menuItemId ?? 0,
        name: item.name,
        category: "Pizza",
        size: (item.size as "small" | "medium" | "large") ?? null,
        sizeLabel: item.size ?? "Única",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    });
    toast({ title: "¡Pedido agregado al carrito!", description: "Revisa tu carrito para confirmar." });
  };

  const hasRating = order.rating != null;

  return (
    <Link href={`/mis-pedidos/${order.id}`}>
      <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-bold text-lg">Pedido #{order.id}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {date}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
              {status.icon} {status.label}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          {order.items.slice(0, 2).map((item) => (
            <span key={item.id} className="mr-2">
              {item.quantity}x {item.name}
              {item.size ? ` (${item.size})` : ""}
            </span>
          ))}
          {order.items.length > 2 && <span>+{order.items.length - 2} más</span>}
        </div>

        <div className="flex items-center justify-between">
          <div className="font-bold text-primary text-lg">S/.{(order.total / 100).toFixed(0)}</div>
          <div className="flex gap-2">
            {order.status === "ENTREGADO" && !hasRating && (
              <button
                onClick={(e) => { e.preventDefault(); }}
                className="text-xs flex items-center gap-1 text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full hover:bg-yellow-100 transition-colors"
              >
                <Star className="w-3 h-3" />
                Calificar
              </button>
            )}
            {hasRating && (
              <span className="text-xs flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <Star className="w-3 h-3 fill-current" />
                Calificado
              </span>
            )}
            <button
              onClick={(e) => { e.preventDefault(); handleReorder(); }}
              className="text-xs flex items-center gap-1 text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              <Repeat2 className="w-3 h-3" />
              Volver a pedir
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MyOrdersPage() {
  const { data: orders, isLoading } = useGetMyOrders({ query: { queryKey: ["my-orders"], refetchInterval: 30000 } });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          Mis Pedidos
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border h-32 animate-pulse" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">Aún no tienes pedidos</h2>
            <p className="text-muted-foreground mb-6">¡Haz tu primer pedido de pizza!</p>
            <Link href="/menu">
              <button className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Ver el Menú
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
