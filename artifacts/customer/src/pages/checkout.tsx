import { useState } from "react";
import { useLocation } from "wouter";
import {
  CreditCard, MapPin, Smartphone, Building2, Truck,
  ChevronRight, CheckCircle2, Copy, Check, Lock,
  AlertCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import { useCart } from "@/lib/cart";
import { useCreateMyOrder, useGetMyAddresses } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "YAPE_PLIN" | "BANK_TRANSFER" | "CASH_ON_DELIVERY" | "IZIPAY_CARD";
type DeliveryType = "delivery" | "pickup";
type Step = "delivery" | "payment" | "confirm" | "izipay";

const PAYMENT_METHODS = [
  {
    key: "CASH_ON_DELIVERY" as const,
    label: "Contra entrega",
    icon: Truck,
    desc: "Paga en efectivo al recibir tu pedido",
    badge: null,
  },
  {
    key: "YAPE_PLIN" as const,
    label: "Yape / Plin",
    icon: Smartphone,
    desc: "Escanea el QR y adjunta tu comprobante",
    badge: null,
  },
  {
    key: "BANK_TRANSFER" as const,
    label: "Transferencia bancaria",
    icon: Building2,
    desc: "Transfiere y envía tu comprobante",
    badge: null,
  },
  {
    key: "IZIPAY_CARD" as const,
    label: "Tarjeta de crédito / débito",
    icon: CreditCard,
    desc: "Visa, Mastercard, Amex — pago seguro con Izipay",
    badge: "NUEVO",
  },
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

function formatCardNumber(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  return val.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
}

type IzipaySession = { orderId: number; amount: number; formToken: string; simulationMode: boolean };
type SimulationState = "idle" | "processing" | "success" | "failed";

function IzipaySimulationForm({
  session,
  onSuccess,
  onFailure,
}: {
  session: IzipaySession;
  onSuccess: () => void;
  onFailure: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [state, setState] = useState<SimulationState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "Número de tarjeta inválido";
    if (!cardName.trim()) e.cardName = "Nombre requerido";
    if (expiry.length < 5) e.expiry = "Fecha inválida";
    if (cvv.length < 3) e.cvv = "CVV inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async (success: boolean) => {
    if (!validate()) return;
    setState("processing");
    await new Promise((r) => setTimeout(r, 2200));

    try {
      const res = await fetch("/api/portal/payments/confirm-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: session.orderId, success }),
      });
      if (!res.ok) throw new Error();
      setState(success ? "success" : "failed");
      if (success) {
        await new Promise((r) => setTimeout(r, 1500));
        onSuccess();
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        onFailure();
      }
    } catch {
      setState("failed");
      await new Promise((r) => setTimeout(r, 1500));
      onFailure();
    }
  };

  const cardDigits = cardNumber.replace(/\s/g, "");
  const cardBrand = cardDigits.startsWith("4") ? "VISA" : cardDigits.startsWith("5") ? "MC" : null;

  if (state === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="font-semibold text-lg text-center">Procesando tu pago...</p>
        <p className="text-sm text-muted-foreground text-center">No cierres esta página</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <p className="font-bold text-xl text-green-700">¡Pago aprobado!</p>
        <p className="text-sm text-muted-foreground">Redirigiendo a tu pedido...</p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <p className="font-bold text-xl text-red-600">Pago rechazado</p>
        <p className="text-sm text-muted-foreground text-center">Tu tarjeta fue rechazada.<br />Verifica los datos o usa otro método.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs tracking-widest text-slate-400 uppercase">Izipay — Pago Seguro</div>
          <div className="flex items-center gap-2">
            {cardBrand === "VISA" && (
              <span className="bg-white text-slate-900 font-black text-sm px-2 py-0.5 rounded italic">VISA</span>
            )}
            {cardBrand === "MC" && (
              <span className="flex gap-[-4px]">
                <span className="w-6 h-6 rounded-full bg-red-500 opacity-90 inline-block" />
                <span className="w-6 h-6 rounded-full bg-orange-400 opacity-90 inline-block -ml-3" />
              </span>
            )}
            {!cardBrand && <CreditCard className="w-7 h-7 text-slate-400" />}
          </div>
        </div>
        <div className="font-mono text-lg tracking-[0.3em] mb-4 text-white/90">
          {(cardNumber || "•••• •••• •••• ••••").padEnd(19, " ")}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">TITULAR</div>
            <div className="text-sm font-semibold tracking-widest uppercase">{cardName || "NOMBRE APELLIDO"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">VENCE</div>
            <div className="text-sm font-mono">{expiry || "MM/AA"}</div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Modo simulación</strong> — Usa cualquier dato para probar.
          Tarjeta de prueba: <span className="font-mono font-bold">4111 1111 1111 1111</span> · Exp: <span className="font-mono font-bold">12/28</span> · CVV: <span className="font-mono font-bold">123</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div>
          <Label htmlFor="cardNumber">Número de tarjeta</Label>
          <div className="relative mt-1">
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className={`font-mono pr-10 ${errors.cardNumber ? "border-red-400" : ""}`}
              maxLength={19}
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
        </div>

        <div>
          <Label htmlFor="cardName">Nombre en la tarjeta</Label>
          <Input
            id="cardName"
            placeholder="JUAN PEREZ"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            className={`mt-1 ${errors.cardName ? "border-red-400" : ""}`}
          />
          {errors.cardName && <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="expiry">Vencimiento (MM/AA)</Label>
            <Input
              id="expiry"
              placeholder="12/28"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className={`mt-1 font-mono ${errors.expiry ? "border-red-400" : ""}`}
              maxLength={5}
            />
            {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={`mt-1 font-mono ${errors.cvv ? "border-red-400" : ""}`}
              maxLength={4}
              type="password"
            />
            {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
        <Lock className="w-3 h-3" />
        <span>Pago cifrado con SSL · Powered by Izipay</span>
      </div>

      <Button
        onClick={() => handlePay(true)}
        className="w-full bg-primary text-white rounded-xl py-3 text-base font-bold"
      >
        🔒 Pagar S/.{(session.amount / 100).toFixed(0)}
      </Button>

      <button
        onClick={() => handlePay(false)}
        className="w-full text-center text-xs text-muted-foreground underline py-1 hover:text-foreground"
      >
        Simular pago rechazado (para pruebas)
      </button>
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
  const [izipaySession, setIzipaySession] = useState<IzipaySession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const selectedAddr = addresses?.find((a) => a.id === selectedAddressId) ?? defaultAddress;
  const deliveryAddress =
    deliveryType === "delivery"
      ? selectedAddr
        ? `${selectedAddr.address}${selectedAddr.district ? ", " + selectedAddr.district : ""}${selectedAddr.reference ? " (Ref: " + selectedAddr.reference + ")" : ""}`
        : customAddress
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

      if (paymentMethod === "IZIPAY_CARD") {
        setSessionLoading(true);
        try {
          const res = await fetch("/api/portal/payments/create-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ orderId: order.id }),
          });
          if (!res.ok) throw new Error("No se pudo iniciar el pago con tarjeta");
          const session = (await res.json()) as IzipaySession;
          setIzipaySession(session);
          setStep("izipay");
        } catch (err) {
          toast({
            title: "Error al iniciar pago",
            description: "No se pudo conectar con la pasarela de pagos. Tu pedido fue creado — usa otro método de pago.",
            variant: "destructive",
          });
          setLocation(`/mis-pedidos/${order.id}`);
        } finally {
          setSessionLoading(false);
        }
        return;
      }

      toast({
        title: "¡Pedido realizado! 🎉",
        description: `Pedido #${order.id} confirmado. ${paymentMethod === "CASH_ON_DELIVERY" ? "Ten el monto exacto al recibir." : "Recuerda enviar tu comprobante."}`,
      });
      setLocation(`/mis-pedidos/${order.id}`);
    } catch {
      toast({ title: "Error", description: "No se pudo crear el pedido. Intenta de nuevo.", variant: "destructive" });
    }
  };

  const STEPS_LABELS: Record<Exclude<Step, "izipay">, string> = {
    delivery: "Entrega",
    payment: "Pago",
    confirm: "Confirmar",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Finalizar Pedido</h1>

        {step !== "izipay" && (
          <div className="flex items-center gap-2 mb-8">
            {(["delivery", "payment", "confirm"] as Exclude<Step, "izipay">[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === s
                      ? "bg-primary text-white"
                      : i < ["delivery", "payment", "confirm"].indexOf(step)
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm hidden sm:block ${step === s ? "font-semibold" : "text-muted-foreground"}`}
                >
                  {STEPS_LABELS[s]}
                </span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        )}

        {step === "izipay" && izipaySession && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Pago con tarjeta</h2>
                <p className="text-sm text-muted-foreground">Pedido #{izipaySession.orderId} · S/.{(izipaySession.amount / 100).toFixed(0)}</p>
              </div>
            </div>
            <IzipaySimulationForm
              session={izipaySession}
              onSuccess={() => setLocation(`/mis-pedidos/${izipaySession.orderId}`)}
              onFailure={() => {
                toast({
                  title: "Pago no procesado",
                  description: "Puedes reintentar o elegir otro método de pago en tu pedido.",
                  variant: "destructive",
                });
                setLocation(`/mis-pedidos/${izipaySession.orderId}`);
              }}
            />
          </div>
        )}

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
                          {addr.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addr.address}
                          {addr.district ? `, ${addr.district}` : ""}
                        </p>
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

        {step === "payment" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Método de pago
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ key, label, icon: Icon, desc, badge }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                      paymentMethod === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === key ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{label}</span>
                        {badge && (
                          <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
                            {badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                    </div>
                    {key === "IZIPAY_CARD" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="bg-blue-900 text-white font-black text-[10px] px-1.5 py-0.5 rounded italic">VISA</span>
                        <span className="flex">
                          <span className="w-4 h-4 rounded-full bg-red-500 opacity-90" />
                          <span className="w-4 h-4 rounded-full bg-orange-400 opacity-90 -ml-2" />
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {paymentMethod === "YAPE_PLIN" && <QRPaymentInfo total={total} />}
              {paymentMethod === "BANK_TRANSFER" && <BankTransferInfo total={total} />}
              {paymentMethod === "CASH_ON_DELIVERY" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-orange-800 font-medium">💵 Ten listo el monto exacto al recibir tu pedido:</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">S/.{(total / 100).toFixed(0)}</p>
                </div>
              )}
              {paymentMethod === "IZIPAY_CARD" && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-violet-800">Pago seguro con tarjeta</p>
                    <p className="text-xs text-violet-600 mt-1">
                      Serás dirigido al formulario de pago de Izipay. Tu pedido se confirma al completar el pago.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">SSL Seguro</span>
                      <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">3D Secure</span>
                      <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Izipay</span>
                    </div>
                  </div>
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

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-semibold mb-4">Resumen del pedido</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={`${item.menuItemId}-${item.size}`} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                      {item.sizeLabel && item.sizeLabel !== "Única" ? ` (${item.sizeLabel})` : ""}
                    </span>
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

            {paymentMethod === "IZIPAY_CARD" ? (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
                <p className="text-sm text-violet-800">
                  Al confirmar, serás redirigido al formulario de pago de Izipay para ingresar los datos de tu tarjeta.
                </p>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/80">
                  Al confirmar, tu pedido será enviado a cocina.{" "}
                  {paymentMethod === "CASH_ON_DELIVERY"
                    ? "Ten el monto exacto al recibir."
                    : "Recuerda enviar tu comprobante de pago."}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("payment")} className="flex-1 rounded-xl">
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createOrder.isPending || sessionLoading}
                className="flex-1 bg-primary text-white rounded-xl font-semibold"
              >
                {createOrder.isPending || sessionLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {sessionLoading ? "Iniciando pago..." : "Confirmando..."}
                  </span>
                ) : paymentMethod === "IZIPAY_CARD" ? (
                  "🔒 Ir a pagar con tarjeta"
                ) : (
                  "✅ Confirmar Pedido"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
