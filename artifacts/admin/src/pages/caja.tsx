import { useMemo } from "react";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import type { OrderWithItems } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/format";
import { format, isToday, startOfDay } from "date-fns";
import {
  DollarSign, Smartphone, Banknote, CreditCard, CheckCircle2,
  Clock, TrendingUp, ShoppingBag, Bike, Package, AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── helpers ─── */
function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function SummaryCard({ label, value, sub, icon: Icon, colorClass, isLoading }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; colorClass: string; isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {isLoading ? <Skeleton className="h-8 w-24 mb-1" /> : (
        <p className="text-3xl font-black text-gray-900">{value}</p>
      )}
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function PaymentRow({ label, amount, count, pctVal, colorClass }: {
  label: string; amount: number; count: number; pctVal: number; colorClass: string;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${colorClass}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-gray-900 text-sm">{label}</span>
          <span className="font-black text-gray-900">{formatMoney(amount)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-current h-1.5 rounded-full transition-all" style={{ width: `${pctVal}%` }} />
          </div>
          <span className="text-xs text-gray-500 shrink-0">{count} pedido{count !== 1 ? "s" : ""} · {pctVal}%</span>
        </div>
      </div>
    </div>
  );
}

export default function CajaPage() {
  const { data: orders, isLoading } = useListOrders(
    { limit: 500 },
    { query: { refetchInterval: 15000, queryKey: getListOrdersQueryKey({ limit: 500 }) } }
  );

  const stats = useMemo(() => {
    if (!orders) return null;

    const todayOrders = orders.filter((o) => isToday(new Date(o.createdAt)));

    // By payment method
    const byPayment = {
      CASH_ON_DELIVERY: todayOrders.filter((o) => o.paymentMethod === "CASH_ON_DELIVERY"),
      YAPE_PLIN:        todayOrders.filter((o) => o.paymentMethod === "YAPE_PLIN"),
      BANK_TRANSFER:    todayOrders.filter((o) => o.paymentMethod === "BANK_TRANSFER"),
    };

    const sumBy = (arr: OrderWithItems[]) => arr.reduce((s, o) => s + (o.total ?? 0), 0);

    const totalToday         = sumBy(todayOrders);
    const cashTotal          = sumBy(byPayment.CASH_ON_DELIVERY);
    const yapeTotal          = sumBy(byPayment.YAPE_PLIN);
    const bankTotal          = sumBy(byPayment.BANK_TRANSFER);

    // Only entregados should be collected
    const cashDelivered      = byPayment.CASH_ON_DELIVERY.filter((o) => o.status === "ENTREGADO");
    const cashPending        = byPayment.CASH_ON_DELIVERY.filter((o) => o.status !== "ENTREGADO");
    const cashCollected      = sumBy(cashDelivered);
    const cashPendingAmt     = sumBy(cashPending);

    // By status
    const byStatus: Record<string, OrderWithItems[]> = {};
    todayOrders.forEach((o) => {
      byStatus[o.status] = [...(byStatus[o.status] ?? []), o];
    });

    // By delivery type
    const deliveryOrders = todayOrders.filter((o) => o.deliveryType === "DELIVERY");
    const recojoOrders   = todayOrders.filter((o) => o.deliveryType === "RECOJO");

    return {
      todayOrders,
      totalToday,
      cashTotal, yapeTotal, bankTotal,
      cashCollected, cashPendingAmt,
      byStatus,
      deliveryOrders, recojoOrders,
      byPayment,
    };
  }, [orders]);

  const now = new Date();

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Cuadre de Caja</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen del día · {format(now, "EEEE d MMMM yyyy")}</p>
        </div>
        <div className="text-right text-xs text-gray-400 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Actualiza en tiempo real
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total facturado hoy"
          value={stats ? formatMoney(stats.totalToday) : "—"}
          sub={`${stats?.todayOrders.length ?? 0} pedidos`}
          icon={TrendingUp}
          colorClass="bg-primary"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Efectivo cobrado"
          value={stats ? formatMoney(stats.cashCollected) : "—"}
          sub={`Entregados contra entrega`}
          icon={Banknote}
          colorClass="bg-emerald-600"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Efectivo pendiente"
          value={stats ? formatMoney(stats.cashPendingAmt) : "—"}
          sub={`Pedidos aún no entregados`}
          icon={AlertCircle}
          colorClass="bg-amber-500"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Digital (Yape + Transfer)"
          value={stats ? formatMoney((stats.yapeTotal ?? 0) + (stats.bankTotal ?? 0)) : "—"}
          sub="Ya depositado"
          icon={Smartphone}
          colorClass="bg-violet-500"
          isLoading={isLoading}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-1">Desglose por Forma de Pago</h2>
          <p className="text-xs text-gray-400 mb-5">Pedidos del día</p>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : !stats ? null : (
            <div className="space-y-3">
              <PaymentRow
                label="💵 Efectivo contra entrega"
                amount={stats.cashTotal}
                count={stats.byPayment.CASH_ON_DELIVERY.length}
                pctVal={pct(stats.cashTotal, stats.totalToday)}
                colorClass="bg-emerald-50 border-emerald-200 text-emerald-600"
              />
              <PaymentRow
                label="📱 Yape / Plin"
                amount={stats.yapeTotal}
                count={stats.byPayment.YAPE_PLIN.length}
                pctVal={pct(stats.yapeTotal, stats.totalToday)}
                colorClass="bg-violet-50 border-violet-200 text-violet-600"
              />
              <PaymentRow
                label="🏦 Transferencia bancaria"
                amount={stats.bankTotal}
                count={stats.byPayment.BANK_TRANSFER.length}
                pctVal={pct(stats.bankTotal, stats.totalToday)}
                colorClass="bg-blue-50 border-blue-200 text-blue-600"
              />

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between">
                <span className="font-black text-gray-900">Total del día</span>
                <span className="font-black text-2xl text-primary">{formatMoney(stats.totalToday)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Orders by status */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-black text-gray-900 mb-4">Estado de Pedidos Hoy</h2>
            {isLoading ? (
              <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>
            ) : !stats ? null : (
              <div className="space-y-2">
                {[
                  { status: "RECIBIDO",       label: "Nuevos",            colorCls: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock },
                  { status: "EN_PREPARACION", label: "En preparación",    colorCls: "bg-blue-50 text-blue-700 border-blue-200",       icon: ShoppingBag },
                  { status: "LISTO",          label: "Listo (esperan repartidor)", colorCls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
                  { status: "EN_CAMINO",      label: "En camino",          colorCls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Bike },
                  { status: "ENTREGADO",      label: "Entregados al cliente", colorCls: "bg-gray-50 text-gray-600 border-gray-200",      icon: Package },
                ].map(({ status, label, colorCls, icon: Icon }) => (
                  <div key={status} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${colorCls}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                    <span className="font-black text-lg">{stats.byStatus[status]?.length ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery vs Recojo */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-black text-gray-900 mb-4">Delivery vs Recojo</h2>
            {isLoading ? (
              <Skeleton className="h-20 w-full rounded-xl" />
            ) : !stats ? null : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                    <Bike className="w-4 h-4" /> Delivery
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-900">{stats.deliveryOrders.length}</p>
                    <p className="text-xs text-blue-600">{formatMoney(stats.deliveryOrders.reduce((s, o) => s + (o.total ?? 0), 0))}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                    🏠 Recojo en tienda
                  </div>
                  <div className="text-right">
                    <p className="font-black text-orange-900">{stats.recojoOrders.length}</p>
                    <p className="text-xs text-orange-600">{formatMoney(stats.recojoOrders.reduce((s, o) => s + (o.total ?? 0), 0))}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cash orders detail */}
      {stats && stats.byPayment.CASH_ON_DELIVERY.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-1">Detalle Efectivo Contra Entrega</h2>
          <p className="text-xs text-gray-400 mb-5">Solo pedidos de pago en efectivo</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-bold text-gray-500 pb-3 pr-4">#</th>
                  <th className="text-left font-bold text-gray-500 pb-3 pr-4">Cliente</th>
                  <th className="text-left font-bold text-gray-500 pb-3 pr-4">Tipo</th>
                  <th className="text-left font-bold text-gray-500 pb-3 pr-4">Hora</th>
                  <th className="text-right font-bold text-gray-500 pb-3 pr-4">Total</th>
                  <th className="text-center font-bold text-gray-500 pb-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.byPayment.CASH_ON_DELIVERY.map((order) => (
                  <tr key={order.id} className={order.status === "ENTREGADO" ? "opacity-60" : ""}>
                    <td className="py-3 pr-4 font-black text-gray-700">#{order.id}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">{order.customerName}</td>
                    <td className="py-3 pr-4 text-gray-500">
                      {order.deliveryType === "DELIVERY" ? "🛵 Delivery" : "🏠 Recojo"}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{format(new Date(order.createdAt), "HH:mm")}</td>
                    <td className="py-3 pr-4 text-right font-black text-gray-900">{formatMoney(order.total)}</td>
                    <td className="py-3 text-center">
                      {order.status === "ENTREGADO" ? (
                        <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200">✓ Cobrado</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">⏳ Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={4} className="pt-3 font-black text-gray-600">Total efectivo del día</td>
                  <td className="pt-3 pr-4 text-right font-black text-xl text-emerald-600">{formatMoney(stats.cashTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
