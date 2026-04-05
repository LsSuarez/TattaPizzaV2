import type React from "react";
import { useGetDashboardStats, useListOrders, getGetDashboardStatsQueryKey, getListOrdersQueryKey } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/format";
import { format } from "date-fns";
import {
  TrendingUp, ShoppingBag, Users, Star, ArrowRight, Clock, ChefHat,
  CheckCircle2, Bike, PackageCheck, RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

function StatCard({ title, value, sub, icon: Icon, accentClass, isLoading }: {
  title: string; value: React.ReactNode; sub: string;
  icon: React.ElementType; accentClass: string; isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24 mb-1" />
      ) : (
        <p className="text-3xl font-black text-gray-900">{value}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function PipelineRow({ icon: Icon, label, count, colorClass, isLoading }: {
  icon: React.ElementType; label: string; count: number; colorClass: string; isLoading: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${colorClass}`}>
      <div className="flex items-center gap-2.5 font-semibold text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-8" />
      ) : (
        <span className="font-black text-xl">{count}</span>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    RECIBIDO:       { label: "RECIBIDO",     cls: "bg-orange-100 text-orange-700 border-orange-200" },
    EN_PREPARACION: { label: "EN PREP.",     cls: "bg-blue-100 text-blue-700 border-blue-200" },
    LISTO:          { label: "LISTO",         cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    EN_CAMINO:      { label: "EN CAMINO",    cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    ENTREGADO:      { label: "ENTREGADO",    cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { refetchInterval: 10000, queryKey: getGetDashboardStatsQueryKey() },
  });
  const { data: recentOrders, isLoading: ordersLoading } = useListOrders(
    { limit: 8 },
    { query: { refetchInterval: 10000, queryKey: getListOrdersQueryKey({ limit: 8 }) } }
  );

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Operaciones en tiempo real · Tata Pizza</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-700">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
          <div className="flex items-center justify-end gap-1 text-xs text-gray-400 mt-0.5">
            <RefreshCw className="w-3 h-3" /> Auto-actualiza cada 10s
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas de hoy"
          value={statsLoading ? null : formatMoney(stats?.totalRevenueToday)}
          sub="Total facturado hoy"
          icon={TrendingUp}
          accentClass="bg-primary"
          isLoading={statsLoading}
        />
        <StatCard
          title="Pedidos hoy"
          value={statsLoading ? null : stats?.totalOrdersToday ?? 0}
          sub={`${stats?.deliveredOrdersToday ?? 0} entregados al cliente`}
          icon={ShoppingBag}
          accentClass="bg-blue-500"
          isLoading={statsLoading}
        />
        <StatCard
          title="Clientes registrados"
          value={statsLoading ? null : stats?.totalCustomers ?? 0}
          sub="Total en la plataforma"
          icon={Users}
          accentClass="bg-violet-500"
          isLoading={statsLoading}
        />
        <StatCard
          title="Más vendido hoy"
          value={statsLoading ? null : (stats?.topItems?.[0]?.name ?? "—")}
          sub={stats?.topItems?.[0] ? `${stats.topItems[0].count} unidades` : "Sin ventas aún"}
          icon={Star}
          accentClass="bg-amber-500"
          isLoading={statsLoading}
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-black text-gray-900">Últimos Pedidos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Pedidos más recientes</p>
            </div>
            <Link href="/orders">
              <span className="flex items-center gap-1 text-sm text-primary font-bold hover:underline" data-testid="link-view-all-orders">
                Ver tablero <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ordersLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : !recentOrders?.length ? (
              <div className="text-center py-10 text-gray-400 text-sm">No hay pedidos aún hoy</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-700 text-sm shrink-0">
                    #{order.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-400">
                      {order.deliveryType === "DELIVERY" ? "🛵" : "🏠"} {order.deliveryType} · {formatMoney(order.total)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusPill status={order.status} />
                    <span className="text-[10px] text-gray-400">{format(new Date(order.createdAt), "HH:mm")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline + quick access */}
        <div className="space-y-5">
          {/* Pipeline */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-black text-gray-900 mb-1">Pipeline de Cocina</h2>
            <p className="text-xs text-gray-400 mb-4">Estado actual de pedidos activos</p>
            <div className="space-y-2">
              <PipelineRow
                icon={Clock} label="Por preparar" isLoading={statsLoading}
                count={stats?.pendingOrders ?? 0}
                colorClass="bg-orange-50 border-orange-200 text-orange-700"
              />
              <PipelineRow
                icon={ChefHat} label="En preparación" isLoading={statsLoading}
                count={stats?.inPreparationOrders ?? 0}
                colorClass="bg-blue-50 border-blue-200 text-blue-700"
              />
              <PipelineRow
                icon={CheckCircle2} label="Listos — esperan repartidor" isLoading={statsLoading}
                count={stats?.readyOrders ?? 0}
                colorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
              />
              <PipelineRow
                icon={Bike} label="En camino al cliente" isLoading={statsLoading}
                count={(recentOrders ?? []).filter((o) => o.status === "EN_CAMINO").length}
                colorClass="bg-indigo-50 border-indigo-200 text-indigo-700"
              />
              <PipelineRow
                icon={PackageCheck} label="Entregados al cliente" isLoading={statsLoading}
                count={stats?.deliveredOrdersToday ?? 0}
                colorClass="bg-gray-50 border-gray-200 text-gray-600"
              />
            </div>
          </div>

          {/* Quick access panels */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-black text-gray-900 mb-3">Acceso Rápido</h2>
            <div className="space-y-2">
              <Link href="/cocina">
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-bold text-orange-800 text-sm">Abrir Vista Cocina</p>
                    <p className="text-xs text-orange-600">Para el pizzero</p>
                  </div>
                </div>
              </Link>
              <Link href="/repartidor">
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                  <Bike className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-800 text-sm">Abrir Vista Repartidor</p>
                    <p className="text-xs text-blue-600">Para el motorizado</p>
                  </div>
                </div>
              </Link>
              <Link href="/caja">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">Cuadre de Caja</p>
                    <p className="text-xs text-emerald-600">Resumen y cierre del día</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
