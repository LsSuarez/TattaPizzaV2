import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import type { OrderWithItems, OrderItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/lib/format";
import { format } from "date-fns";
import { ChefHat, Clock, ChevronRight, Bell, RefreshCw, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

/* ─── Cocina flow ─────────────────────────────────────
   RECIBIDO → EN_PREPARACION → LISTO
   El pizzero marca LISTO = pizza lista para que el REPARTIDOR la recoja.
   El pizzero NO puede avanzar más allá de LISTO.
   El repartidor toma desde LISTO → EN_CAMINO → ENTREGADO.
──────────────────────────────────────────────────────── */

export default function CocinaPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { data: orders, isLoading, refetch } = useListOrders(
    { limit: 200 },
    { query: { refetchInterval: 8000, queryKey: getListOrdersQueryKey({ limit: 200 }) } }
  );

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 8000);
    return () => clearInterval(interval);
  }, []);

  const recibidos = orders?.filter((o) => o.status === "RECIBIDO") ?? [];
  const enPrep    = orders?.filter((o) => o.status === "EN_PREPARACION") ?? [];
  const listos    = orders?.filter((o) => o.status === "LISTO") ?? [];
  const activeCount = recibidos.length + enPrep.length + listos.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/30">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black">Vista Cocina</h1>
            <p className="text-xs text-gray-400">Tata Pizza · Pizzero — {format(new Date(), "HH:mm")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm px-3 py-1.5 rounded-full font-bold">
              <Bell className="w-3.5 h-3.5" />
              {activeCount} pedido{activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
            </div>
          )}
          <button
            onClick={() => { refetch(); setLastRefresh(new Date()); }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {format(lastRefresh, "HH:mm:ss")}
          </button>
        </div>
      </header>

      {/* Flow indicator */}
      <div className="bg-gray-900/60 border-b border-gray-800 px-6 py-2 flex items-center gap-3 text-xs text-gray-500">
        <span className="text-orange-400 font-semibold">🔔 Nuevo Pedido</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-blue-400 font-semibold">👨‍🍳 En Preparación</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-green-400 font-semibold">✅ Listo</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-500 italic">repartidor recoge y lleva al cliente</span>
      </div>

      {/* Columns */}
      <div className="flex-1 grid grid-cols-3 gap-0 divide-x divide-gray-800 overflow-hidden" style={{ minHeight: 0 }}>

        {/* RECIBIDO */}
        <Column
          title="Nuevo Pedido"
          emoji="🔔"
          subtitle="Pedido recibido — iniciar preparación"
          orders={recibidos}
          isLoading={isLoading}
          nextLabel="Empezar preparación"
          nextStatus="EN_PREPARACION"
          bgHeader="bg-orange-500/10"
          border="border-orange-500/30"
          badgeClass="bg-orange-500/20 text-orange-400"
          btnClass="bg-orange-500 hover:bg-orange-600"
          emptyText="No hay nuevos pedidos"
        />

        {/* EN_PREPARACION */}
        <Column
          title="En Preparación"
          emoji="👨‍🍳"
          subtitle="Horneando — cuando esté lista, marcar como Listo"
          orders={enPrep}
          isLoading={isLoading}
          nextLabel="✅ Lista — Avisar Repartidor"
          nextStatus="LISTO"
          bgHeader="bg-blue-500/10"
          border="border-blue-500/30"
          badgeClass="bg-blue-500/20 text-blue-400"
          btnClass="bg-blue-500 hover:bg-blue-600"
          emptyText="Nada en preparación"
        />

        {/* LISTO — para que el repartidor la recoja */}
        <Column
          title="Listo — Repartidor en Espera"
          emoji="✅"
          subtitle="Pizza lista · El repartidor debe recogerla"
          orders={listos}
          isLoading={isLoading}
          nextLabel={null}
          nextStatus={null}
          bgHeader="bg-green-500/10"
          border="border-green-500/30"
          badgeClass="bg-green-500/20 text-green-400"
          btnClass=""
          emptyText="Nada listo aún"
          showRepartidorHint
        />
      </div>
    </div>
  );
}

interface ColumnProps {
  title: string; emoji: string; subtitle: string;
  orders: OrderWithItems[]; isLoading: boolean;
  nextLabel: string | null; nextStatus: string | null;
  bgHeader: string; border: string; badgeClass: string; btnClass: string;
  emptyText: string; showRepartidorHint?: boolean;
}

function Column({ title, emoji, subtitle, orders, isLoading, nextLabel, nextStatus, bgHeader, border, badgeClass, btnClass, emptyText, showRepartidorHint }: ColumnProps) {
  return (
    <div className="flex flex-col overflow-hidden">
      <div className={`${bgHeader} border-b ${border} px-4 py-3`}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-black text-base flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            {title}
          </span>
          <span className={`text-sm font-black px-2.5 py-0.5 rounded-full ${badgeClass}`}>
            {orders.length}
          </span>
        </div>
        <p className="text-xs text-gray-500 ml-8">{subtitle}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-10 text-sm">Cargando...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-600 py-10 text-sm">{emptyText}</div>
        ) : (
          <>
            {showRepartidorHint && orders.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2">
                📳 Avisar al repartidor que hay {orders.length} pizza{orders.length !== 1 ? "s" : ""} lista{orders.length !== 1 ? "s" : ""}
              </div>
            )}
            {orders.map((order) => (
              <KitchenCard
                key={order.id}
                order={order}
                nextStatus={nextStatus}
                nextLabel={nextLabel}
                btnClass={btnClass}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function KitchenCard({ order, nextStatus, nextLabel, btnClass }: {
  order: OrderWithItems;
  nextStatus: string | null;
  nextLabel: string | null;
  btnClass: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();

  const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = minutesAgo >= 15;

  const handleAdvance = () => {
    if (!nextStatus) return;
    updateStatus.mutate(
      { id: order.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          toast({ title: `Pedido #${order.id} → ${nextStatus.replace("_", " ")}` });
          queryClient.setQueryData(getListOrdersQueryKey({ limit: 200 }), (old: OrderWithItems[] | undefined) =>
            old ? old.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o) : old
          );
        },
        onError: () => toast({ variant: "destructive", title: "Error al actualizar" }),
      }
    );
  };

  return (
    <div className={`bg-gray-800 rounded-xl border overflow-hidden ${isUrgent ? "border-red-500/60 shadow-red-500/10 shadow-lg" : "border-gray-700"}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-black text-2xl text-white">#{order.id}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
            order.deliveryType === "DELIVERY"
              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
              : "bg-orange-500/20 text-orange-400 border-orange-500/30"
          }`}>
            {order.deliveryType === "DELIVERY" ? "🛵 Delivery" : "🏠 Recojo"}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-red-400" : "text-gray-400"}`}>
          <Clock className="w-3.5 h-3.5" />
          {minutesAgo === 0 ? "Ahora" : `${minutesAgo} min`}
          {isUrgent && " ⚠️"}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-gray-400 font-semibold">{order.customerName}</p>
        <div className="space-y-1.5">
          {order.items.map((item: OrderItem) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="bg-orange-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                {item.quantity}
              </span>
              <div className="text-sm font-medium leading-tight">
                <span className="text-white">{item.name}</span>
                {item.size && <span className="text-gray-400 text-xs ml-1">· {item.size}</span>}
              </div>
            </div>
          ))}
        </div>
        {order.notes && (
          <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg px-3 py-2 italic">
            📝 {order.notes}
          </div>
        )}
      </div>

      {/* Action */}
      {nextStatus && nextLabel && (
        <div className="px-4 pb-4">
          <button
            className={`w-full ${btnClass} text-white font-black h-12 text-base rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95`}
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? "Actualizando..." : nextLabel}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
