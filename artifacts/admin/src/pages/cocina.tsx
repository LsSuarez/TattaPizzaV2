import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import type { OrderWithItems, OrderItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/lib/format";
import { format } from "date-fns";
import { ChefHat, Clock, CheckCircle2, ChevronRight, Bell, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const KITCHEN_STATUSES = ["RECIBIDO", "EN_PREPARACION", "LISTO"];

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

  const kitchenOrders = orders?.filter((o) =>
    o.status === "RECIBIDO" || o.status === "EN_PREPARACION" || o.status === "LISTO"
  ) ?? [];

  const recibidos = kitchenOrders.filter((o) => o.status === "RECIBIDO");
  const enPrep = kitchenOrders.filter((o) => o.status === "EN_PREPARACION");
  const listos = kitchenOrders.filter((o) => o.status === "LISTO");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2.5 rounded-xl">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Vista Cocina</h1>
            <p className="text-xs text-gray-400">Tata Pizza · Pizzero</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {kitchenOrders.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm px-3 py-1.5 rounded-full font-medium">
              <Bell className="w-3.5 h-3.5" />
              {kitchenOrders.length} pedido{kitchenOrders.length !== 1 ? "s" : ""} activo{kitchenOrders.length !== 1 ? "s" : ""}
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

      {/* Columns */}
      <div className="flex-1 grid grid-cols-3 gap-0 divide-x divide-gray-800 overflow-hidden" style={{ minHeight: 0 }}>
        {/* RECIBIDO */}
        <Column
          title="Nuevo Pedido"
          emoji="🔔"
          orders={recibidos}
          isLoading={isLoading}
          nextLabel="Empezar a preparar"
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
          orders={enPrep}
          isLoading={isLoading}
          nextLabel="Marcar como Listo"
          nextStatus="LISTO"
          bgHeader="bg-blue-500/10"
          border="border-blue-500/30"
          badgeClass="bg-blue-500/20 text-blue-400"
          btnClass="bg-blue-500 hover:bg-blue-600"
          emptyText="Nada en preparación"
        />

        {/* LISTO */}
        <Column
          title="Listo para Despachar"
          emoji="✅"
          orders={listos}
          isLoading={isLoading}
          nextLabel={null}
          nextStatus={null}
          bgHeader="bg-green-500/10"
          border="border-green-500/30"
          badgeClass="bg-green-500/20 text-green-400"
          btnClass=""
          emptyText="Nada listo aún"
        />
      </div>
    </div>
  );
}

interface ColumnProps {
  title: string;
  emoji: string;
  orders: OrderWithItems[];
  isLoading: boolean;
  nextLabel: string | null;
  nextStatus: string | null;
  bgHeader: string;
  border: string;
  badgeClass: string;
  btnClass: string;
  emptyText: string;
}

function Column({ title, emoji, orders, isLoading, nextLabel, nextStatus, bgHeader, border, badgeClass, btnClass, emptyText }: ColumnProps) {
  return (
    <div className="flex flex-col overflow-hidden">
      <div className={`${bgHeader} border-b ${border} px-4 py-3 flex items-center justify-between`}>
        <span className="font-bold text-base flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          {title}
        </span>
        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
          {orders.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-10">Cargando...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-600 py-10 text-sm">{emptyText}</div>
        ) : (
          orders.map((order) => (
            <KitchenCard
              key={order.id}
              order={order}
              nextStatus={nextStatus}
              nextLabel={nextLabel}
              btnClass={btnClass}
            />
          ))
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
    <div className={`bg-gray-800 rounded-xl border ${isUrgent ? "border-red-500/60" : "border-gray-700"} overflow-hidden`}>
      {/* Card header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-black text-2xl text-white">#{order.id}</span>
          <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">
            {order.deliveryType === "DELIVERY" ? "🛵 Delivery" : "🏠 Recojo"}
          </Badge>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-red-400" : "text-gray-400"}`}>
          <Clock className="w-3.5 h-3.5" />
          {minutesAgo === 0 ? "Ahora" : `${minutesAgo} min`}
          {isUrgent && " ⚠️"}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-gray-400 font-medium">{order.customerName}</p>
        <div className="space-y-1.5">
          {order.items.map((item: OrderItem) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="bg-orange-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                {item.quantity}
              </span>
              <span className="text-sm text-white font-medium leading-tight">
                {item.name}
                {item.size && <span className="text-gray-400 font-normal"> · {item.size}</span>}
              </span>
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
          <Button
            className={`w-full ${btnClass} text-white font-bold h-12 text-base rounded-xl flex items-center justify-center gap-2`}
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? "..." : nextLabel}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
