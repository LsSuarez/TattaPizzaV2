import { useGetDashboardStats, useListOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { format } from "date-fns";
import { PieChart, ListOrdered, UtensilsCrossed, Users, ArrowRight, Clock, ChefHat, CheckCircle2, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats(undefined, {
    query: { refetchInterval: 10000 },
  });

  const { data: recentOrders, isLoading: isOrdersLoading } = useListOrders(
    { limit: 5 },
    { query: { refetchInterval: 10000 } }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time operations overview for Tata Pizza.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          <p className="text-xs text-muted-foreground">Auto-updating every 10s</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={isStatsLoading ? null : formatMoney(stats?.totalRevenueToday)}
          icon={PieChart}
          description="Today's sales"
          color="text-primary"
        />
        <StatCard
          title="Orders Today"
          value={isStatsLoading ? null : stats?.totalOrdersToday.toString()}
          icon={ListOrdered}
          description={`${stats?.deliveredOrdersToday || 0} delivered`}
          color="text-blue-500"
        />
        <StatCard
          title="Active Customers"
          value={isStatsLoading ? null : stats?.totalCustomers.toString()}
          icon={Users}
          description="Total registered"
          color="text-secondary"
        />
        <StatCard
          title="Top Item"
          value={isStatsLoading ? null : stats?.topItems?.[0]?.name || "N/A"}
          icon={UtensilsCrossed}
          description={stats?.topItems?.[0] ? `${stats.topItems[0].count} sold today` : "No sales yet"}
          color="text-accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders received</CardDescription>
            </div>
            <Link href="/orders" className="text-sm text-primary hover:underline flex items-center gap-1" data-testid="link-view-all-orders">
              View all board <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <div className="space-y-4 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentOrders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No orders yet today.</div>
            ) : (
              <div className="space-y-4 mt-4">
                {recentOrders?.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border border-border/50">
                        #{order.id}
                      </div>
                      <div>
                        <p className="font-semibold">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.deliveryType} • {formatMoney(order.total)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "h:mm a")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Kitchen Status</CardTitle>
              <CardDescription>Live order pipeline</CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30">
                <div className="flex items-center gap-2 font-medium">
                  <Clock size={18} /> Pendientes (Recibido)
                </div>
                <div className="font-bold text-xl">{isStatsLoading ? "-" : stats?.pendingOrders || 0}</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center gap-2 font-medium">
                  <ChefHat size={18} /> En Preparación
                </div>
                <div className="font-bold text-xl">{isStatsLoading ? "-" : stats?.inPreparationOrders || 0}</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={18} /> Listos
                </div>
                <div className="font-bold text-xl">{isStatsLoading ? "-" : stats?.readyOrders || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, color }: { title: string, value: React.ReactNode, icon: any, description: string, color: string }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'RECIBIDO':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50">RECIBIDO</Badge>;
    case 'EN_PREPARACION':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">EN PREP</Badge>;
    case 'LISTO':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50">LISTO</Badge>;
    case 'ENTREGADO':
      return <Badge variant="outline" className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">ENTREGADO</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
