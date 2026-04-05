import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, X, Send, ShoppingCart, ChevronRight,
  MapPin, Phone, User, CreditCard, CheckCircle2,
  Plus, Minus, Pizza, Bike, Store, Trash2, ArrowLeft,
} from "lucide-react";
import { useListMenuItems } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

/* ─────────────── TYPES ─────────────── */
interface CartItem {
  menuItemId: number;
  name: string;
  size: string | null;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
}

type Step =
  | "GREETING"
  | "MENU"
  | "CART_REVIEW"
  | "GET_NAME"
  | "GET_PHONE"
  | "GET_DELIVERY_TYPE"
  | "GET_ADDRESS"
  | "GET_PAYMENT"
  | "CONFIRM"
  | "DONE";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
}

/* ─────────────── HELPERS ─────────────── */
let _id = 1;
const mkId = () => _id++;

const now = () =>
  new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

const fmt = (cents: number) => `S/.${(cents / 100).toFixed(0)}`;

const BOT_MESSAGES: Record<Step, string> = {
  GREETING: "¡Hola! 👋 Soy el asistente de **Tata Pizza**. ¿Quieres hacer un pedido ahora mismo?",
  MENU: "Genial 🍕 Elige tus productos del menú:",
  CART_REVIEW: "¿Quieres agregar algo más o continuamos con el pedido?",
  GET_NAME: "¿Cuál es tu nombre completo?",
  GET_PHONE: "¿Tu número de teléfono? (para confirmar el pedido)",
  GET_DELIVERY_TYPE: "¿Cómo prefieres recibir tu pedido?",
  GET_ADDRESS: "¿Cuál es tu dirección de entrega? (calle, número, distrito)",
  GET_PAYMENT: "¿Cómo vas a pagar?",
  CONFIRM: "Revisa tu pedido y confirma:",
  DONE: "",
};

const PAYMENT_LABELS: Record<string, string> = {
  YAPE_PLIN: "📱 Yape / Plin",
  BANK_TRANSFER: "🏦 Transferencia BCP",
  CASH_ON_DELIVERY: "💵 Efectivo (contra entrega)",
};

const CATEGORY_EMOJI: Record<string, string> = {
  pizza: "🍕",
  bebida: "🥤",
  postre: "🍰",
  complemento: "🧀",
  entrada: "🥗",
};

/* ─────────────── COMPONENT ─────────────── */
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("GREETING");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "RECOJO">("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [menuFilter, setMenuFilter] = useState<string>("all");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: menuItems } = useListMenuItems({ available: true });

  const categories = menuItems
    ? ["all", ...Array.from(new Set(menuItems.map((i) => i.category?.toLowerCase() ?? "otro")))]
    : ["all"];

  const filteredItems = menuItems?.filter(
    (i) => menuFilter === "all" || i.category?.toLowerCase() === menuFilter
  ) ?? [];

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── scroll ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step]);

  /* ── init greeting ── */
  useEffect(() => {
    if (open && messages.length === 0) {
      pushBot(BOT_MESSAGES.GREETING);
    }
  }, [open]);

  /* ── helpers ── */
  const pushBot = useCallback((text: string) => {
    setMessages((p) => [...p, { id: mkId(), from: "bot", text, time: now() }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((p) => [...p, { id: mkId(), from: "user", text, time: now() }]);
  }, []);

  const goStep = useCallback(
    (next: Step, botMsg?: string) => {
      setStep(next);
      if (botMsg ?? BOT_MESSAGES[next]) {
        setTimeout(() => pushBot(botMsg ?? BOT_MESSAGES[next]), 300);
      }
    },
    [pushBot]
  );

  /* ── cart actions ── */
  const addToCart = (item: NonNullable<typeof menuItems>[number], size: "small" | "medium" | "large" | null, sizeLabel: string, price: number) => {
    setCart((prev) => {
      const key = `${item.id}-${size}`;
      const existing = prev.find((c) => `${c.menuItemId}-${c.size}` === key);
      if (existing) {
        return prev.map((c) =>
          `${c.menuItemId}-${c.size}` === key ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, size, sizeLabel, quantity: 1, unitPrice: price }];
    });
    toast({ title: `${item.name} agregado 🍕`, description: fmt(price) });
  };

  const removeFromCart = (menuItemId: number, size: string | null) => {
    setCart((p) => p.filter((c) => !(c.menuItemId === menuItemId && c.size === size)));
  };

  const updateQty = (menuItemId: number, size: string | null, delta: number) => {
    setCart((p) =>
      p
        .map((c) =>
          c.menuItemId === menuItemId && c.size === size
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  /* ── text input handler ── */
  const handleSend = () => {
    const val = textInput.trim();
    if (!val) return;
    setTextInput("");

    switch (step) {
      case "GET_NAME":
        pushUser(val);
        setCustomerName(val);
        goStep("GET_PHONE");
        break;
      case "GET_PHONE":
        pushUser(val);
        setCustomerPhone(val);
        goStep("GET_DELIVERY_TYPE");
        break;
      case "GET_ADDRESS":
        pushUser(val);
        setDeliveryAddress(val);
        goStep("GET_PAYMENT");
        break;
      default:
        break;
    }
  };

  /* ── place order ── */
  const placeOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone,
          deliveryType,
          deliveryAddress: deliveryType === "DELIVERY" ? deliveryAddress : null,
          paymentMethod,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            size: c.size,
            quantity: c.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear pedido");

      setOrderId(data.orderId);
      setStep("DONE");
      pushBot(
        `✅ ¡Pedido #${data.orderId} confirmado! 🎉\n\nTu pizza está en preparación. Te llamamos al ${customerPhone} si hay alguna novedad.\n\n⏱ Tiempo estimado: ${deliveryType === "DELIVERY" ? "30–45 minutos" : "15–20 minutos"}`
      );
      setCart([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      pushBot(`❌ Hubo un problema al confirmar tu pedido: ${msg}. Intenta de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  /* ── reset ── */
  const reset = () => {
    setMessages([]);
    setStep("GREETING");
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setPaymentMethod("CASH_ON_DELIVERY");
    setOrderId(null);
    setTimeout(() => pushBot(BOT_MESSAGES.GREETING), 200);
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  /* ─────────────── RENDER ─────────────── */
  const needsTextInput = ["GET_NAME", "GET_PHONE", "GET_ADDRESS"].includes(step);
  const inputPlaceholder: Record<string, string> = {
    GET_NAME: "Tu nombre completo...",
    GET_PHONE: "Ej: 987654321",
    GET_ADDRESS: "Calle, número, distrito...",
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: "linear-gradient(135deg, #e63946 0%, #c1121f 100%)" }}
          aria-label="Abrir asistente"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden"
          style={{ width: 380, height: 620, maxHeight: "calc(100vh - 1.5rem)" }}
        >
          {/* ── HEADER ── */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ background: "linear-gradient(135deg, #e63946 0%, #c1121f 100%)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Pizza className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">Asistente Tata Pizza</p>
                <p className="text-xs text-white/75 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  Disponible 24/7
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cartCount > 0 && step !== "DONE" && (
                <button
                  onClick={() => goStep("CART_REVIEW")}
                  className="relative bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── PROGRESS BAR ── */}
          {step !== "GREETING" && step !== "DONE" && (
            <div className="h-1 bg-gray-100 shrink-0">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${(["MENU","CART_REVIEW","GET_NAME","GET_PHONE","GET_DELIVERY_TYPE","GET_ADDRESS","GET_PAYMENT","CONFIRM"].indexOf(step) + 1) / 8 * 100}%`
                }}
              />
            </div>
          )}

          {/* ── MESSAGES ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} items-end gap-1.5`}>
                {msg.from === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mb-0.5">
                    <Pizza className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line shadow-sm ${
                    msg.from === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                  }`}
                >
                  {msg.text}
                  <div className={`text-[10px] mt-0.5 ${msg.from === "user" ? "text-white/60" : "text-gray-400"}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* ── STEP CONTENT ── */}
          <div className="shrink-0 border-t border-gray-100 bg-white">
            {/* GREETING */}
            {step === "GREETING" && (
              <div className="p-3 space-y-2">
                <button
                  onClick={() => goStep("MENU")}
                  className="w-full bg-primary text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <Pizza className="w-4 h-4" /> Hacer un pedido ahora
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { pushUser("Ver el menú"); goStep("MENU"); }}
                    className="border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    🍕 Ver menú
                  </button>
                  <button
                    onClick={() => { pushUser("¿Cuánto demora?"); pushBot("⏱ Delivery: 30–45 min\n🏠 Recojo: 15–20 min\n\n¡Trabajamos rápido! 🔥"); }}
                    className="border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ⏱ Tiempos
                  </button>
                </div>
              </div>
            )}

            {/* MENU */}
            {step === "MENU" && (
              <div>
                {/* Category filter */}
                <div className="flex gap-1.5 px-3 pt-2.5 pb-1.5 overflow-x-auto scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMenuFilter(cat)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        menuFilter === cat
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat === "all" ? "Todos" : `${CATEGORY_EMOJI[cat] ?? "🍽"} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                    </button>
                  ))}
                </div>

                {/* Items */}
                <div className="overflow-y-auto px-3 pb-2 space-y-2" style={{ maxHeight: 220 }}>
                  {filteredItems.map((item) => {
                    const hasSizes = item.priceSmall && item.priceLarge;
                    const emoji = CATEGORY_EMOJI[item.category?.toLowerCase() ?? ""] ?? "🍽";
                    return (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xl shrink-0">{emoji}</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 leading-tight">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.priceSmall && (
                            <button
                              onClick={() => addToCart(item, "small", hasSizes ? "Personal" : "Única", item.priceSmall!)}
                              className="flex-1 min-w-0 bg-white border border-primary/30 text-primary rounded-lg py-1.5 text-xs font-semibold hover:bg-primary hover:text-white transition-colors flex flex-col items-center"
                            >
                              <span>{hasSizes ? "Personal" : "Única"}</span>
                              <span className="font-bold">{fmt(item.priceSmall)}</span>
                            </button>
                          )}
                          {item.priceMedium && (
                            <button
                              onClick={() => addToCart(item, "medium", "Mediana", item.priceMedium!)}
                              className="flex-1 min-w-0 bg-white border border-primary/30 text-primary rounded-lg py-1.5 text-xs font-semibold hover:bg-primary hover:text-white transition-colors flex flex-col items-center"
                            >
                              <span>Mediana</span>
                              <span className="font-bold">{fmt(item.priceMedium)}</span>
                            </button>
                          )}
                          {item.priceLarge && (
                            <button
                              onClick={() => addToCart(item, "large", "Familiar", item.priceLarge!)}
                              className="flex-1 min-w-0 bg-white border border-primary/30 text-primary rounded-lg py-1.5 text-xs font-semibold hover:bg-primary hover:text-white transition-colors flex flex-col items-center"
                            >
                              <span>Familiar</span>
                              <span className="font-bold">{fmt(item.priceLarge)}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cart summary + next */}
                <div className="px-3 pb-3 pt-1.5 border-t border-gray-100">
                  {cartCount > 0 ? (
                    <button
                      onClick={() => goStep("CART_REVIEW")}
                      className="w-full bg-primary text-white rounded-xl py-3 font-bold flex items-center justify-between px-4 hover:bg-primary/90 transition-colors"
                    >
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">{cartCount}</span>
                      <span>Revisar pedido</span>
                      <span className="font-bold">{fmt(cartTotal)}</span>
                    </button>
                  ) : (
                    <p className="text-center text-xs text-gray-400 py-1">Selecciona productos para continuar</p>
                  )}
                </div>
              </div>
            )}

            {/* CART REVIEW */}
            {step === "CART_REVIEW" && (
              <div className="p-3 space-y-2">
                <div className="overflow-y-auto space-y-1.5" style={{ maxHeight: 160 }}>
                  {cart.map((item) => (
                    <div key={`${item.menuItemId}-${item.size}`} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.sizeLabel} · {fmt(item.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => updateQty(item.menuItemId, item.size, -1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.menuItemId, item.size, 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(item.menuItemId, item.size)} className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm font-bold px-1">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-primary text-base">{fmt(cartTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setStep("MENU"); setMenuFilter("all"); pushBot("Claro, ¿qué más quieres agregar?"); }}
                    className="border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Agregar más
                  </button>
                  <button
                    onClick={() => goStep("GET_NAME")}
                    className="bg-primary text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
                  >
                    Continuar <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* GET_NAME / GET_PHONE / GET_ADDRESS — text input */}
            {needsTextInput && (
              <div className="p-3">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type={step === "GET_PHONE" ? "tel" : "text"}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={inputPlaceholder[step] ?? "Escribe aquí..."}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                    autoFocus
                  />
                  <button
                    onClick={handleSend}
                    disabled={!textInput.trim()}
                    className="bg-primary text-white rounded-xl px-3 disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {step === "GET_NAME" && <User className="w-3.5 h-3.5 text-gray-400" />}
                  {step === "GET_PHONE" && <Phone className="w-3.5 h-3.5 text-gray-400" />}
                  {step === "GET_ADDRESS" && <MapPin className="w-3.5 h-3.5 text-gray-400" />}
                  <p className="text-xs text-gray-400">
                    {step === "GET_NAME" && "Tu nombre para identificar el pedido"}
                    {step === "GET_PHONE" && "Te llamamos solo si hay alguna duda"}
                    {step === "GET_ADDRESS" && "Incluye calle, número y distrito"}
                  </p>
                </div>
              </div>
            )}

            {/* GET_DELIVERY_TYPE */}
            {step === "GET_DELIVERY_TYPE" && (
              <div className="p-3 space-y-2">
                <button
                  onClick={() => {
                    pushUser("🛵 Delivery a domicilio");
                    setDeliveryType("DELIVERY");
                    goStep("GET_ADDRESS");
                  }}
                  className="w-full border-2 border-gray-200 hover:border-primary rounded-xl p-3 flex items-center gap-3 text-left transition-colors group"
                >
                  <div className="w-10 h-10 bg-primary/10 group-hover:bg-primary/20 rounded-full flex items-center justify-center shrink-0 transition-colors">
                    <Bike className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Delivery a domicilio</p>
                    <p className="text-xs text-gray-400">30–45 min · Llevamos hasta tu puerta</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    pushUser("🏠 Recojo en tienda");
                    setDeliveryType("RECOJO");
                    goStep("GET_PAYMENT");
                  }}
                  className="w-full border-2 border-gray-200 hover:border-primary rounded-xl p-3 flex items-center gap-3 text-left transition-colors group"
                >
                  <div className="w-10 h-10 bg-primary/10 group-hover:bg-primary/20 rounded-full flex items-center justify-center shrink-0 transition-colors">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Recojo en tienda</p>
                    <p className="text-xs text-gray-400">15–20 min · Más rápido y sin costo de envío</p>
                  </div>
                </button>
              </div>
            )}

            {/* GET_PAYMENT */}
            {step === "GET_PAYMENT" && (
              <div className="p-3 space-y-1.5">
                {[
                  { key: "YAPE_PLIN", label: "📱 Yape / Plin", desc: "Paga con tu app al número registrado" },
                  { key: "BANK_TRANSFER", label: "🏦 Transferencia BCP", desc: "Envía al número de cuenta BCP" },
                  { key: "CASH_ON_DELIVERY", label: "💵 Efectivo", desc: "Paga al recibir tu pedido" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      pushUser(opt.label);
                      setPaymentMethod(opt.key);
                      goStep("CONFIRM");
                    }}
                    className="w-full border-2 border-gray-200 hover:border-primary rounded-xl p-2.5 flex items-center gap-3 text-left transition-colors group"
                  >
                    <div className="w-9 h-9 bg-primary/10 group-hover:bg-primary/20 rounded-full flex items-center justify-center shrink-0 text-lg transition-colors">
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* CONFIRM */}
            {step === "CONFIRM" && (
              <div className="p-3 space-y-2.5">
                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Cliente</span>
                    <span className="font-semibold text-gray-800">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</span>
                    <span className="font-semibold text-gray-800">{customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      {deliveryType === "DELIVERY" ? <Bike className="w-3 h-3" /> : <Store className="w-3 h-3" />} Entrega
                    </span>
                    <span className="font-semibold text-gray-800">{deliveryType === "DELIVERY" ? "Delivery" : "Recojo"}</span>
                  </div>
                  {deliveryType === "DELIVERY" && deliveryAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección</span>
                      <span className="font-semibold text-gray-800 text-right max-w-[60%] leading-tight">{deliveryAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Pago</span>
                    <span className="font-semibold text-gray-800">{PAYMENT_LABELS[paymentMethod]}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5 space-y-0.5">
                    {cart.map((item) => (
                      <div key={`${item.menuItemId}-${item.size}`} className="flex justify-between">
                        <span className="text-gray-600">{item.quantity}x {item.name} {item.size && `(${item.sizeLabel})`}</span>
                        <span className="text-gray-700 font-medium">{fmt(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200 mt-1">
                      <span className="text-gray-800">Total</span>
                      <span className="text-primary">{fmt(cartTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="w-full bg-primary text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirmar pedido · {fmt(cartTotal)}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* DONE */}
            {step === "DONE" && orderId && (
              <div className="p-4 text-center space-y-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">¡Pedido #{orderId} recibido!</p>
                  <p className="text-xs text-gray-500 mt-1">Ya está en la cocina 🍕</p>
                </div>
                <button
                  onClick={reset}
                  className="w-full border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Hacer otro pedido
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-400 text-center">Tata Pizza · Lima, Perú · 24/7</p>
          </div>
        </div>
      )}
    </>
  );
}
