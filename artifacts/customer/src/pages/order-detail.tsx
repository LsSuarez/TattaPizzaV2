import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Star, Package, Clock, MapPin, CreditCard, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/navbar";
import { useGetMyOrder, useSubmitMyRating } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { status: "RECIBIDO", label: "Pedido recibido", icon: "📥" },
  { status: "EN_PREPARACION", label: "En preparación", icon: "👨‍🍳" },
  { status: "LISTO", label: "Listo para envío", icon: "✅" },
  { status: "EN_CAMINO", label: "En camino", icon: "🛵" },
  { status: "ENTREGADO", label: "Entregado", icon: "🏠" },
];

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => onChange(star)} className="transition-transform hover:scale-110">
            <Star className={`w-8 h-8 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted stroke-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailPage({ id }: { id: number }) {
  const { data: order, isLoading, refetch } = useGetMyOrder(id, { query: { queryKey: ["my-order", id], refetchInterval: 30000 } });
  const submitRating = useSubmitMyRating();
  const { toast } = useToast();

  const [productRating, setProductRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Pedido no encontrado</h2>
          <Link href="/mis-pedidos"><Button variant="outline">Ver mis pedidos</Button></Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.status === order.status);
  const hasRating = order.rating != null;
  const canRate = order.status === "ENTREGADO" && !hasRating && !ratingSubmitted;

  const handleRating = async () => {
    if (!productRating || !deliveryRating || !serviceRating) {
      toast({ title: "Completa la calificación", description: "Por favor califica los tres aspectos", variant: "destructive" });
      return;
    }
    try {
      await submitRating.mutateAsync({ id, data: { productRating, deliveryRating, serviceRating, comment: comment || undefined } });
      setRatingSubmitted(true);
      refetch();
      toast({ title: "¡Gracias por tu calificación! ⭐", description: "Tu opinión nos ayuda a mejorar." });
    } catch {
      toast({ title: "Error", description: "No se pudo enviar la calificación.", variant: "destructive" });
    }
  };

  const date = new Date(order.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const PAYMENT_LABELS: Record<string, string> = {
    CASH_ON_DELIVERY: "Pago contra entrega",
    YAPE: "Yape",
    PLIN: "Plin",
    TRANSFER: "Transferencia bancaria",
  };

  const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "text-orange-600 bg-orange-50" },
    PROOF_SUBMITTED: { label: "Comprobante enviado", color: "text-blue-600 bg-blue-50" },
    VERIFIED: { label: "Pago verificado", color: "text-green-600 bg-green-50" },
  };

  const paymentStatus = PAYMENT_STATUS_LABELS[order.paymentStatus ?? "PENDING"] ?? PAYMENT_STATUS_LABELS["PENDING"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/mis-pedidos">
            <button className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Pedido #{order.id}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />{date}
            </p>
          </div>
        </div>

        {/* Status tracking */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-5">Seguimiento del pedido</h2>
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isLast = i === STEPS.length - 1;
              return (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                      isDone ? "bg-primary border-primary text-white" : "bg-white border-border text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}>
                      {isDone ? (isCurrent ? step.icon : "✓") : step.icon}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 mt-1 ${isDone && i < currentStepIndex ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                  <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
                    <p className={`text-sm font-medium mt-2.5 ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary font-medium mt-0.5">Estado actual</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> Detalle del pedido
          </h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                <span>
                  {item.quantity}x {item.name}
                  {item.size ? ` (${item.size})` : ""}
                </span>
                <span className="font-medium">S/.{(item.subtotal / 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg pt-3">
            <span>Total</span>
            <span className="text-primary">S/.{(order.total / 100).toFixed(0)}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3 text-sm">
          {order.deliveryAddress && (
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Dirección de entrega</p>
                <p className="text-muted-foreground">{order.deliveryAddress}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Método de pago</p>
              <p className="text-muted-foreground">{PAYMENT_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod}</p>
              {order.paymentMethod !== "CASH_ON_DELIVERY" && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatus.color}`}>
                  {paymentStatus.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        {canRate && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-semibold mb-1">¿Cómo fue tu experiencia?</h2>
            <p className="text-sm text-muted-foreground mb-5">Califica tu pedido</p>
            <StarRating value={productRating} onChange={setProductRating} label="Calidad del producto" />
            <StarRating value={deliveryRating} onChange={setDeliveryRating} label="Tiempo de entrega" />
            <StarRating value={serviceRating} onChange={setServiceRating} label="Servicio general" />
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Comentario (opcional)</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué podemos mejorar?"
                className="w-full border border-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button
              onClick={handleRating}
              disabled={submitRating.isPending}
              className="w-full bg-primary text-white rounded-xl"
            >
              {submitRating.isPending ? "Enviando..." : "⭐ Enviar calificación"}
            </Button>
          </div>
        )}

        {(hasRating || ratingSubmitted) && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">¡Gracias por calificar!</p>
              <p className="text-sm text-green-600">Tu opinión nos ayuda a mejorar el servicio.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
