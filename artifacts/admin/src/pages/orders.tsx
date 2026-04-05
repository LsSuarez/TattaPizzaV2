import { useState } from "react";
import type React from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import type { OrderWithItems, OrderItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/lib/format";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Clock, Phone, MapPin, ChefHat, CheckCircle2, Truck, ChevronRight, PackageCheck, Bike } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

/* ─── Full order flow (5 stages) ─────────────────────────────────────────
   RECIBIDO → EN_PREPARACION → LISTO → EN_CAMINO → ENTREGADO
   |___ Pizzero ______________|         |___ Repartidor ________|
   LISTO = pizzero entregó al repartidor
   ENTREGADO = repartidor entregó al cliente
─────────────────────────────────────────────────────────────────────────── */
const STATUSES = ["RECIBIDO", "EN_PREPARACION", "LISTO", "EN_CAMINO", "ENTREGADO"] as const;

type Status = typeof STATUSES[number];

const COLUMN_CONFIG: Record<Status, {
  label: string; emoji: string; bg: string; border: string;
  badge: string; btnLabel: string | null; btnClass: string | null;
}> = {
  RECIBIDO: {
    label: "Nuevo Pedido", emoji: "🔔",
    bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700 border-orange-200",
    btnLabel: "Iniciar preparación", btnClass: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  EN_PREPARACION: {
    label: "En Preparación", emoji: "👨‍🍳",
    bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700 border-blue-200",
    btnLabel: "Listo — Avisar Repartidor", btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  LISTO: {
    label: "Listo · Repartidor Pendiente", emoji: "✅",
    bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    btnLabel: null, btnClass: null,  // Repartidor solo puede avanzar desde su panel
  },
  EN_CAMINO: {
    label: "En Camino 🛵", emoji: "🛵",
    bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    btnLabel: null, btnClass: null,  // Solo repartidor confirma entrega
  },
  ENTREGADO: {
    label: "Entregado al Cliente", emoji: "📦",
    bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-600 border-slate-200",
    btnLabel: null, btnClass: null,
  },
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useListOrders(
    { limit: 300 },
    { query: { refetchInterval: 8000, queryKey: getListOrdersQueryKey({ limit: 300 }) } }
  );

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = orders?.filter((o) => o.status === s) ?? [];
    return acc;
  }, {} as Record<Status, OrderWithItems[]>);

  const activeCount = (grouped.RECIBIDO?.length ?? 0) + (grouped.EN_PREPARACION?.length ?? 0) + (grouped.LISTO?.length ?? 0) + (grouped.EN_CAMINO?.length ?? 0);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tablero de Pedidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Seguimiento en tiempo real — actualiza cada 8s</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {activeCount > 0 && (
            <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-full border border-orange-200">
              🔔 {activeCount} pedido{activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-gray-400 text-xs">{format(new Date(), "HH:mm")}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-3 h-3 bg-orange-400 rounded-full" /> Cocina
        </span>
        <span className="text-gray-300">→</span>
        <span className="flex items-center gap-1.5 text-gray-500 font-semibold">
          <span className="w-3 h-3 bg-emerald-400 rounded-full" /> LISTO = Pizzero entrega al repartidor
        </span>
        <span className="text-gray-300">→</span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-3 h-3 bg-indigo-400 rounded-full" /> Repartidor en ruta
        </span>
        <span className="text-gray-300">→</span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-3 h-3 bg-slate-400 rounded-full" /> ENTREGADO = Al cliente
        </span>
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="grid grid-cols-5 gap-4 flex-1">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl p-4 space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3 flex-1 min-h-0 overflow-hidden pb-4">
          {STATUSES.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              orders={grouped[status] ?? []}
              config={COLUMN_CONFIG[status]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusColumn({ status, orders, config }: {
  status: Status;
  orders: OrderWithItems[];
  config: typeof COLUMN_CONFIG[Status];
}) {
  return (
    <div className={`flex flex-col rounded-2xl border-2 ${config.border} ${config.bg} overflow-hidden`}>
      {/* Column header */}
      <div className={`px-3 py-3 border-b-2 ${config.border} bg-white/60`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm leading-tight">
            <span className="text-lg">{config.emoji}</span>
            <span>{config.label}</span>
          </div>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${config.badge}`}>
            {orders.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs font-medium">
            {status === "ENTREGADO" ? "Sin entregas aún" : "Vacío"}
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} config={config} status={status} />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, config, status }: {
  order: OrderWithItems;
  config: typeof COLUMN_CONFIG[Status];
  status: Status;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();

  const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = minutesAgo >= 20 && status !== "ENTREGADO";

  const handleAdvance = () => {
    const idx = STATUSES.indexOf(status);
    if (idx < 0 || idx >= STATUSES.length - 1) return;
    const next = STATUSES[idx + 1];
    updateStatus.mutate(
      { id: order.id, data: { status: next } },
      {
        onSuccess: () => {
          toast({ title: `Pedido #${order.id} → ${next.replace("_", " ")}` });
          queryClient.setQueryData(getListOrdersQueryKey({ limit: 300 }), (old: OrderWithItems[] | undefined) =>
            old ? old.map((o) => o.id === order.id ? { ...o, status: next } : o) : old
          );
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: "Error al actualizar" }),
      }
    );
  };

  return (
    <div className={`bg-white rounded-xl border-2 overflow-hidden shadow-sm ${isUrgent ? "border-red-400" : "border-gray-100"}`}>
      {/* Top row */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-gray-900">#{order.id}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
            {order.deliveryType === "DELIVERY" ? "🛵" : "🏠"}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-red-500" : "text-gray-400"}`}>
          <Clock className="w-3 h-3" />
          {minutesAgo === 0 ? "ahora" : `${minutesAgo}m`}
          {isUrgent && " ⚠️"}
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {/* Customer */}
        <p className="font-bold text-gray-900 text-xs truncate">{order.customerName}</p>
        {order.customerPhone && (
          <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 text-blue-500 text-xs hover:text-blue-700">
            <Phone className="w-3 h-3" /> {order.customerPhone}
          </a>
        )}

        {/* Items */}
        <div className="bg-gray-50 rounded-lg px-2 py-1.5 space-y-1">
          {order.items.map((item: OrderItem) => (
            <div key={item.id} className="flex items-center gap-1.5 text-xs">
              <span className="bg-primary/10 text-primary font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px]">
                {item.quantity}
              </span>
              <span className="text-gray-700 truncate">{item.name}{item.size && ` (${item.size})`}</span>
            </div>
          ))}
        </div>

        {/* Address for delivery */}
        {order.deliveryType === "DELIVERY" && order.deliveryAddress && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-1 text-xs text-indigo-600 hover:text-indigo-800"
          >
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{order.deliveryAddress}</span>
          </a>
        )}

        {/* Total + payment */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-gray-900">{formatMoney(order.total)}</span>
          <span className="text-gray-400">
            {order.paymentMethod === "CASH_ON_DELIVERY" ? "💵 Efectivo" :
             order.paymentMethod === "YAPE_PLIN" ? "📱 Yape" : "🏦 Transfer."}
          </span>
        </div>

        {order.notes && (
          <div className="text-[10px] bg-yellow-50 border border-yellow-200 text-yellow-700 rounded px-2 py-1 italic">
            📝 {order.notes}
          </div>
        )}
      </div>

      {/* Action button — only if admin can advance this stage */}
      {config.btnLabel && config.btnClass && (
        <div className="px-2 pb-2">
          <button
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
            className={`w-full ${config.btnClass} font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95`}
            data-testid={`btn-advance-order-${order.id}`}
          >
            {updateStatus.isPending ? "..." : config.btnLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
