import { useState } from "react";
import type React from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import type { OrderWithItems, OrderItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, MapPin, ChefHat, CheckCircle2, Truck, ChevronRight, PackageCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ['RECIBIDO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];

export default function OrdersPage() {
  const { data: orders, isLoading } = useListOrders(
    { limit: 200 },
    { query: { refetchInterval: 10000, queryKey: getListOrdersQueryKey({ limit: 200 }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Board</h1>
          <p className="text-muted-foreground mt-1">Live order tracking and progression.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[70vh]">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-muted/30 rounded-xl p-4 flex flex-col gap-4 border border-border/50">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getOrdersByStatus = (status: string) => {
    return orders?.filter(o => o.status === status) || [];
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders Board</h1>
        <p className="text-muted-foreground mt-1">Live order tracking and progression.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden pb-4">
        <StatusColumn 
          title="Recibido" 
          status="RECIBIDO" 
          orders={getOrdersByStatus('RECIBIDO')} 
          icon={Clock}
          colorClass="bg-orange-50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/30"
          headerClass="text-orange-800 dark:text-orange-400"
        />
        <StatusColumn 
          title="En Preparación" 
          status="EN_PREPARACION" 
          orders={getOrdersByStatus('EN_PREPARACION')} 
          icon={ChefHat}
          colorClass="bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/30"
          headerClass="text-blue-800 dark:text-blue-400"
        />
        <StatusColumn 
          title="Listo" 
          status="LISTO" 
          orders={getOrdersByStatus('LISTO')} 
          icon={CheckCircle2}
          colorClass="bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30"
          headerClass="text-green-800 dark:text-green-400"
        />
        <StatusColumn 
          title="Entregado" 
          status="ENTREGADO" 
          orders={getOrdersByStatus('ENTREGADO')} 
          icon={PackageCheck}
          colorClass="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
          headerClass="text-slate-800 dark:text-slate-400"
        />
      </div>
    </div>
  );
}

interface StatusColumnProps {
  title: string;
  status: string;
  orders: OrderWithItems[];
  icon: React.ElementType;
  colorClass: string;
  headerClass: string;
}

function StatusColumn({ title, orders, icon: Icon, colorClass, headerClass }: StatusColumnProps) {
  return (
    <div className={`flex flex-col rounded-xl border ${colorClass} overflow-hidden`}>
      <div className={`p-4 border-b border-inherit bg-white/50 dark:bg-black/20 flex items-center justify-between ${headerClass}`}>
        <div className="flex items-center gap-2 font-semibold">
          <Icon size={18} />
          {title}
        </div>
        <Badge variant="secondary" className="bg-white/80 dark:bg-black/50 text-current">{orders.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-sm opacity-50 font-medium">
            Empty
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();
  
  const handleAdvance = () => {
    const currentIndex = STATUSES.indexOf(order.status);
    if (currentIndex < STATUSES.length - 1) {
      const nextStatus = STATUSES[currentIndex + 1];
      
      updateStatus.mutate(
        { id: order.id, data: { status: nextStatus } },
        {
          onSuccess: () => {
            toast({
              title: "Status Updated",
              description: `Order #${order.id} moved to ${nextStatus.replace('_', ' ')}`,
            });
            // Patch local cache immediately for fast UI
            queryClient.setQueryData(getListOrdersQueryKey({ limit: 200 }), (old: OrderWithItems[] | undefined) => {
              if (!old) return old;
              return old.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o);
            });
            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to update order status",
            });
          }
        }
      );
    }
  };

  const isLastStatus = order.status === STATUSES[STATUSES.length - 1];

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">#{order.id}</span>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase tracking-wider">
              {order.deliveryType}
            </Badge>
          </div>
          <CardTitle className="text-base mt-1 line-clamp-1">{order.customerName}</CardTitle>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold">{formatMoney(order.total)}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
            <Clock size={12} /> {format(new Date(order.createdAt), "h:mm a")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-sm space-y-3">
        <div className="space-y-1.5 bg-muted/30 p-2 rounded-md border border-border/30">
          {order.items.map((item: OrderItem) => (
            <div key={item.id} className="flex justify-between items-start gap-2">
              <span className="font-medium text-xs leading-tight">
                {item.quantity}x {item.name} {item.size && <span className="text-muted-foreground">({item.size})</span>}
              </span>
            </div>
          ))}
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Phone size={12} /> {order.customerPhone}
          </div>
          {order.deliveryType === 'DELIVERY' && order.deliveryAddress && (
            <div className="flex items-start gap-1.5 mt-1">
              <MapPin size={12} className="mt-0.5 shrink-0" /> 
              <span className="line-clamp-2">{order.deliveryAddress}</span>
            </div>
          )}
          {order.notes && (
            <div className="mt-2 p-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-500 rounded border border-yellow-200 dark:border-yellow-900/30 italic">
              Note: {order.notes}
            </div>
          )}
        </div>
      </CardContent>
      {!isLastStatus && (
        <CardFooter className="p-0 border-t border-border/50">
          <Button 
            variant="ghost" 
            className="w-full h-10 rounded-none text-primary hover:text-primary hover:bg-primary/5 flex items-center justify-center gap-1 font-medium"
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
            data-testid={`btn-advance-order-${order.id}`}
          >
            {updateStatus.isPending ? "Updating..." : "Avanzar Estado"} <ChevronRight size={16} />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
