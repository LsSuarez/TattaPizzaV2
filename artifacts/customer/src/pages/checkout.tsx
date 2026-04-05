import { useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, MapPin, Smartphone, Building2, Truck, ChevronRight, CheckCircle2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import { useCart } from "@/lib/cart";
import { useCreateMyOrder, useGetMyAddresses } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "YAPE_PLIN" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";
type DeliveryType = "delivery" | "pickup";
type Step = "delivery" | "payment" | "confirm";

const PAYMENT_METHODS = [
  { key: "CASH_ON_DELIVERY" as const, label: "Contra entrega", icon: Truck, desc: "Paga en efectivo al recibir tu pedido" },
  { key: "YAPE_PLIN" as const, label: "Yape / Plin", icon: Smartphone, desc: "Escanea el QR y adjunta tu comprobante" },
  { key: "BANK_TRANSFER" as const, label: "Transferencia", icon: Building2, desc: "Transfiere y envía tu comprobante" },
];

function QRPaymentInfo({ total }: { total: number }) {
  const [copied, setCopied] = useState(false);
  const phone = "51987654321";
  const copy = () => {
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-4">
      <h3 className="font-semibold text-green-800 mb-3">Datos de Yape / Plin</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-24 h-24 bg-white border-2 border-green-300 rounded-xl flex items-center justify-center text-4xl">
          📱
        </div>
        <div>
          <p className="text-sm text-green-700">Número de teléfono:</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-lg text-green-900">{phone}</span>
            <button onClick={copy} className="text-green-600 hover:text-green-800">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-sm font-bold text-green-800 mt-1">Total: S/.{(total / 100).toFixed(0)}</p>
          <p className="text-xs text-green-600 mt-1">A nombre de: Tata Pizza S.A.C.</p>
        </div>
      </div>
      <p className="text-xs text-green-700">Realiza el pago y adjunta la captura en el siguiente campo:</p>
      <Input placeholder="URL de la captura del comprobante (opcional)" className="mt-2 border-green-300" />
    </div>
  );
}

function BankTransferInfo({ total }: { total: number }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mt-4">
      <h3 className="font-semibold text-blue-800 mb-3">Datos bancarios</h3>
      <div className="space-y-2 text-sm">
        {[
          ["Banco", "BCP"],
          ["Cuenta", "191-234567890-0-12"],
          ["CCI", "002-191-00234567890012-89"],
          ["Titular", "Tata Pizza S.A.C."],
          ["Monto", `S/.${(total / 100).toFixed(0)}`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-1 border-b border-blue-100 last:border-0">
            <span className="text-blue-600">{label}:</span>
            <span className="font-semibold text-blue-900">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-blue-600 mt-3">Sube el comprobante después de transferir:</p>
      <Input placeholder="URL del comprobante de transferencia (opcional)" className="mt-2 border-blue-300" />
    </div>
  );
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, total, clear } = useCart();
  const { data: addresses } = useGetMyAddresses();
  const createOrder = useCreateMyOrder();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("delivery");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [customAddress, setCustomAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [notes, setNotes] = useState("");

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const selectedAddr = addresses?.find((a) => a.id === selectedAddressId) ?? defaultAddress;
  const deliveryAddress = deliveryType === "delivery"
    ? (selectedAddr ? `${selectedAddr.address}${selectedAddr.district ? ", " + selectedAddr.district : ""}${selectedAddr.reference ? " (Ref: " + selectedAddr.reference + ")" : ""}` : customAddress)
    : null;

  const handleSubmit = async () => {
    try {
      const order = await createOrder.mutateAsync({
        data: {
          deliveryType,
          deliveryAddress: deliveryAddress ?? undefined,
          paymentMethod,
          notes: notes || undefined,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            name: i.name,
            size: i.size ?? undefined,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      });
      clear();
      toast({
        title: "¡Pedido realizado! 🎉",
        description: `Pedido #${order.id} confirmado. ${paymentMethod === "CASH_ON_DELIVERY" ? "Ten el monto exacto al recibir." : "Recuerda enviar tu comprobante."}`,
      });
      setLocation(`/mis-pedidos/${order.id}`);
    } catch {
      toast({ title: "Error", description: "No se pudo crear el pedido. Intenta de nuevo.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Finalizar Pedido</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(["delivery", "payment", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? "bg-primary text-white" : s < step || (step === "confirm" && s !== "confirm") ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === s ? "font-semibold" : "text-muted-foreground"}`}>
                {s === "delivery" ? "Entrega" : s === "payment" ? "Pago" : "Confirmar"}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Delivery */}
        {step === "delivery" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-semibold mb-4">¿Cómo deseas recibir tu pedido?</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["delivery", "pickup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDeliveryType(t)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      deliveryType === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-2xl mb-2">{t === "delivery" ? "🛵" : "🏪"}</div>
                    <div className="font-semibold text-sm">{t === "delivery" ? "Delivery" : "Recojo en tienda"}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t === "delivery" ? "Entrega a domicilio" : "Recoge en el local"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {deliveryType === "delivery" && (
              <div className="bg-white rounded-2xl border border-border p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Dirección de entrega
                </h2>
                {addresses && addresses.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{addr.label}</span>
                          {addr.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Predeterminada</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{addr.address}{addr.district ? `, ${addr.district}` : ""}</p>
                        {addr.reference && <p className="text-xs text-muted-foreground">Ref: {addr.reference}</p>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="addr">Escribe tu dirección</Label>
                    <Input
                      id="addr"
                      placeholder="Av. Larco 123, Miraflores, Lima"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-border p-5">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Input
                id="notes"
                placeholder="Sin aceitunas, puerta principal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button
              onClick={() => setStep("payment")}
              className="w-full bg-primary text-white rounded-xl py-3 text-base"
            >
              Continuar con el pago
            </Button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === "payment" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Método de pago
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ key, label, icon: Icon, desc }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                      paymentMethod === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      paymentMethod === key ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === "YAPE_PLIN" && (
                <QRPaymentInfo total={total} />
              )}
              {paymentMethod === "BANK_TRANSFER" && <BankTransferInfo total={total} />}
              {paymentMethod === "CASH_ON_DELIVERY" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-orange-800 font-medium">💵 Ten listo el monto exacto al recibir tu pedido:</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">S/.{(total / 100).toFixed(0)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("delivery")} className="flex-1 rounded-xl">
                Atrás
              </Button>
              <Button onClick={() => setStep("confirm")} className="flex-1 bg-primary text-white rounded-xl">
                Revisar pedido
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-semibold mb-4">Resumen del pedido</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={`${item.menuItemId}-${item.size}`} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}{item.sizeLabel && item.sizeLabel !== "Única" ? ` (${item.sizeLabel})` : ""}</span>
                    <span className="font-medium">S/.{((item.unitPrice * item.quantity) / 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">S/.{(total / 100).toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrega:</span>
                <span className="font-medium">{deliveryType === "delivery" ? "Delivery" : "Recojo en tienda"}</span>
              </div>
              {deliveryAddress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dirección:</span>
                  <span className="font-medium text-right max-w-[200px]">{deliveryAddress}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago:</span>
                <span className="font-medium">{PAYMENT_METHODS.find((p) => p.key === paymentMethod)?.label}</span>
              </div>
              {notes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notas:</span>
                  <span className="font-medium text-right max-w-[200px]">{notes}</span>
                </div>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/80">
                Al confirmar, tu pedido será enviado a cocina. {paymentMethod === "CASH_ON_DELIVERY"
                  ? "Ten el monto exacto al recibir."
                  : "Recuerda enviar tu comprobante de pago."}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("payment")} className="flex-1 rounded-xl">
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createOrder.isPending}
                className="flex-1 bg-primary text-white rounded-xl font-semibold"
              >
                {createOrder.isPending ? "Confirmando..." : "✅ Confirmar Pedido"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
