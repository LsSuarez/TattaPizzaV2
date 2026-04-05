import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import type { OrderWithItems, OrderItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/lib/format";
import { format } from "date-fns";
import { Bike, Clock, MapPin, Phone, CheckCircle2, Truck, ChevronRight, RefreshCw, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function RepartidorPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { data: orders, isLoading, refetch } = useListOrders(
    { limit: 200 },
    { query: { refetchInterval: 8000, queryKey: getListOrdersQueryKey({ limit: 200 }) } }
  );

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 8000);
    return () => clearInterval(interval);
  }, []);

  const listos = orders?.filter((o) => o.status === "LISTO") ?? [];
  const enCamino = orders?.filter((o) => o.status === "EN_CAMINO") ?? [];
  const entregados = orders?.filter((o) => o.status === "ENTREGADO") ?? [].slice(0, 10);
  const activeCount = listos.length + enCamino.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2.5 rounded-xl">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Vista Repartidor</h1>
            <p className="text-xs text-gray-400">Tata Pizza · Motorizado</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm px-3 py-1.5 rounded-full font-medium">
              <Bell className="w-3.5 h-3.5" />
              {activeCount} activo{activeCount !== 1 ? "s" : ""}
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

      {/* Main content: 2 active columns + entregados */}
      <div className="flex-1 grid grid-cols-3 gap-0 divide-x divide-gray-800 overflow-hidden" style={{ minHeight: 0 }}>
        {/* LISTO */}
        <div className="flex flex-col overflow-hidden">
          <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-base flex items-center gap-2">
              <span className="text-xl">✅</span> Listo para Recoger
            </span>
            <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
              {listos.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <p className="text-gray-500 text-center py-10 text-sm">Cargando...</p>
            ) : listos.length === 0 ? (
              <p className="text-gray-600 text-center py-10 text-sm">Nada listo aún</p>
            ) : (
              listos.map((order) => (
                <DeliveryCard
                  key={order.id}
                  order={order}
                  nextStatus="EN_CAMINO"
                  nextLabel="Salir a Entregar"
                  btnClass="bg-blue-500 hover:bg-blue-600"
                />
              ))
            )}
          </div>
        </div>

        {/* EN_CAMINO */}
        <div className="flex flex-col overflow-hidden">
          <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-base flex items-center gap-2">
              <span className="text-xl">🛵</span> En Camino
            </span>
            <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              {enCamino.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <p className="text-gray-500 text-center py-10 text-sm">Cargando...</p>
            ) : enCamino.length === 0 ? (
              <p className="text-gray-600 text-center py-10 text-sm">Nadie en ruta aún</p>
            ) : (
              enCamino.map((order) => (
                <DeliveryCard
                  key={order.id}
                  order={order}
                  nextStatus="ENTREGADO"
                  nextLabel="Confirmar Entrega"
                  btnClass="bg-green-500 hover:bg-green-600"
                />
              ))
            )}
          </div>
        </div>

        {/* ENTREGADO (últimos 10) */}
        <div className="flex flex-col overflow-hidden">
          <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-base flex items-center gap-2">
              <span className="text-xl">📦</span> Entregados Hoy
            </span>
            <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-gray-700 text-gray-400">
              {orders?.filter((o) => o.status === "ENTREGADO").length ?? 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <p className="text-gray-500 text-center py-10 text-sm">Cargando...</p>
            ) : (orders?.filter((o) => o.status === "ENTREGADO") ?? []).length === 0 ? (
              <p className="text-gray-600 text-center py-10 text-sm">Sin entregas aún hoy</p>
            ) : (
              (orders?.filter((o) => o.status === "ENTREGADO") ?? [])
                .slice()
                .reverse()
                .slice(0, 15)
                .map((order) => (
                  <EntregadoCard key={order.id} order={order} />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryCard({ order, nextStatus, nextLabel, btnClass }: {
  order: OrderWithItems;
  nextStatus: string;
  nextLabel: string;
  btnClass: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();

  const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  const handleAdvance = () => {
    updateStatus.mutate(
      { id: order.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          toast({ title: `Pedido #${order.id} actualizado` });
          queryClient.setQueryData(getListOrdersQueryKey({ limit: 200 }), (old: OrderWithItems[] | undefined) =>
            old ? old.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o) : old
          );
        },
        onError: () => toast({ variant: "destructive", title: "Error al actualizar" }),
      }
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-black text-2xl">#{order.id}</span>
          <span className="text-2xl">{order.deliveryType === "DELIVERY" ? "🛵" : "🏠"}</span>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-green-400">{formatMoney(order.total)}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" /> {minutesAgo} min atrás
          </div>
        </div>
      </div>

      {/* Customer + address */}
      <div className="px-4 py-3 space-y-3">
        <div>
          <p className="font-bold text-white text-lg">{order.customerName}</p>
          <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors mt-1">
            <Phone className="w-4 h-4" />
            <span className="text-base font-medium">{order.customerPhone}</span>
          </a>
        </div>

        {order.deliveryType === "DELIVERY" && order.deliveryAddress && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl px-3 py-2.5 hover:bg-blue-500/20 transition-colors"
          >
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
            <span className="text-sm font-medium leading-snug">{order.deliveryAddress}</span>
          </a>
        )}

        {order.deliveryType === "RECOJO" && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-xl px-3 py-2 text-sm font-medium">
            🏠 Cliente recoge en tienda
          </div>
        )}

        {/* Items summary */}
        <div className="bg-gray-700/50 rounded-lg px-3 py-2 space-y-1">
          {order.items.map((item: OrderItem) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="bg-orange-500/30 text-orange-300 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                {item.quantity}
              </span>
              <span className="text-gray-300">{item.name}{item.size && ` (${item.size})`}</span>
            </div>
          ))}
        </div>

        {/* Payment method */}
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          💳 {order.paymentMethod === "CASH_ON_DELIVERY"
            ? "Efectivo contra entrega"
            : order.paymentMethod === "YAPE_PLIN"
              ? "Yape / Plin"
              : "Transferencia bancaria"}
          {order.paymentMethod === "CASH_ON_DELIVERY" && (
            <span className="text-yellow-400 font-semibold ml-1">· Cobrar {formatMoney(order.total)}</span>
          )}
        </div>

        {order.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg px-3 py-2 italic">
            📝 {order.notes}
          </div>
        )}
      </div>

      {/* Action */}
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
    </div>
  );
}

function EntregadoCard({ order }: { order: OrderWithItems }) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-3 flex items-center justify-between gap-2 opacity-75">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        <div>
          <div className="font-bold text-sm">#{order.id} · {order.customerName}</div>
          <div className="text-xs text-gray-500">
            {format(new Date(order.createdAt), "HH:mm")} · {order.deliveryType === "DELIVERY" ? "🛵" : "🏠"}
          </div>
        </div>
      </div>
      <div className="text-green-400 font-bold text-sm shrink-0">{formatMoney(order.total)}</div>
    </div>
  );
}
