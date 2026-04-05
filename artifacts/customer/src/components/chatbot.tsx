import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ShoppingCart, Pizza } from "lucide-react";
import { useListMenuItems } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Show } from "@clerk/react";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  options?: string[];
  items?: MenuSuggestion[];
}

interface MenuSuggestion {
  menuItemId: number;
  name: string;
  price: number;
  size: "small" | "medium" | "large" | null;
  sizeLabel: string;
  category: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  pizza: "🍕", Pizza: "🍕",
  bebida: "🥤", Bebida: "🥤",
  postre: "🍰", Postre: "🍰",
  complemento: "🧀", Complemento: "🧀",
};

let msgId = 1;
const mkMsg = (from: Message["from"], text: string, opts?: string[], items?: MenuSuggestion[]): Message => ({
  id: msgId++, from, text, options: opts, items,
});

const GREETING = mkMsg("bot",
  "👋 ¡Hola! Soy el asistente de Tata Pizza 🍕\n¿En qué te puedo ayudar hoy?",
  ["Ver el menú", "Pizzas disponibles", "Bebidas", "¿Cómo hacer un pedido?", "Hablar con WhatsApp"]
);

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(1);
  const endRef = useRef<HTMLDivElement>(null);
  const { data: menuItems } = useListMenuItems({ available: true });
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const push = (msg: Message) => setMessages((prev) => [...prev, msg]);

  const getItemPrice = (item: NonNullable<typeof menuItems>[number], size: "small" | "medium" | "large") => {
    if (size === "small") return item.priceSmall;
    if (size === "medium") return item.priceMedium;
    return item.priceLarge;
  };

  const buildSuggestions = (items: NonNullable<typeof menuItems>): MenuSuggestion[] => {
    return items.slice(0, 4).map((item) => {
      const size: "small" | "medium" | "large" = item.priceSmall ? "small" : item.priceMedium ? "medium" : "large";
      const sizeLabel = item.priceSmall && item.priceMedium ? "Personal" : "Única";
      return {
        menuItemId: item.id,
        name: item.name,
        price: getItemPrice(item, size) ?? 0,
        size: (item.priceSmall || item.priceMedium || item.priceLarge) && (item.priceSmall && item.priceMedium) ? size : null,
        sizeLabel,
        category: item.category,
      };
    });
  };

  const processInput = (text: string) => {
    const lower = text.toLowerCase().trim();
    push(mkMsg("user", text));

    setTimeout(() => {
      // WhatsApp
      if (lower.includes("whatsapp") || lower.includes("wsp")) {
        push(mkMsg("bot",
          "📱 También puedes hacer tu pedido por WhatsApp. Nuestro asistente inteligente está disponible 24/7.",
          ["Ver el menú", "Inicio"]
        ));
        return;
      }

      // How to order
      if (lower.includes("cómo") || lower.includes("como") || lower.includes("pedido") || lower.includes("pedir") || lower.includes("ordenar")) {
        push(mkMsg("bot",
          "🛒 Hacer un pedido es muy fácil:\n\n1️⃣ Elige tus pizzas en el menú\n2️⃣ Agrégalas al carrito\n3️⃣ Ve al checkout\n4️⃣ Elige entrega o recojo\n5️⃣ Paga con Yape, transferencia o contra entrega\n\n¡Listo! Te notificamos cuando tu pizza esté en camino 🛵",
          ["Ver el menú", "Pizzas disponibles", "¿Cuánto demora?"]
        ));
        return;
      }

      // Delivery time
      if (lower.includes("demora") || lower.includes("tiempo") || lower.includes("cuánto") || lower.includes("rapido")) {
        push(mkMsg("bot",
          "⏱️ El tiempo estimado es:\n• Delivery: 30–45 minutos\n• Recojo en tienda: 15–20 minutos\n\n¡Trabajamos rápido para que tu pizza llegue bien caliente! 🔥",
          ["Ver el menú", "Hacer un pedido"]
        ));
        return;
      }

      // Payment
      if (lower.includes("pago") || lower.includes("pagar") || lower.includes("yape") || lower.includes("transferencia") || lower.includes("efectivo")) {
        push(mkMsg("bot",
          "💳 Aceptamos los siguientes métodos de pago:\n\n📱 Yape / Plin\n🏦 Transferencia bancaria (BCP)\n💵 Contra entrega (efectivo)\n\nTodos son seguros y fáciles de usar.",
          ["Ver el menú", "Hacer un pedido"]
        ));
        return;
      }

      // Prices / cost
      if (lower.includes("precio") || lower.includes("costo") || lower.includes("cuánto cuesta") || lower.includes("cuanto cuesta") || lower.includes("valor")) {
        const pizzas = menuItems?.filter((i) => i.category?.toLowerCase() === "pizza") ?? [];
        if (pizzas.length > 0) {
          const suggestions = buildSuggestions(pizzas);
          push(mkMsg("bot",
            "💰 Nuestros precios varían según el tamaño. Aquí te muestro algunas opciones:",
            ["Ver todo el menú", "Bebidas"],
            suggestions
          ));
        } else {
          push(mkMsg("bot", "Nuestras pizzas personales empiezan desde S/.25. Puedes ver todos los precios en el menú.", ["Ver el menú"]));
        }
        return;
      }

      // All menu
      if (lower.includes("menú") || lower.includes("menu") || lower.includes("todo") || lower.includes("ver")) {
        const all = menuItems ?? [];
        const suggestions = buildSuggestions(all);
        push(mkMsg("bot",
          `🍽️ Tenemos ${all.length} productos disponibles. Aquí están los más pedidos:`,
          ["Pizzas", "Bebidas", "Ver menú completo"],
          suggestions
        ));
        return;
      }

      // Pizzas
      if (lower.includes("pizza") || lower.includes("pizzas")) {
        const pizzas = menuItems?.filter((i) => i.category?.toLowerCase() === "pizza") ?? [];
        if (pizzas.length > 0) {
          push(mkMsg("bot",
            `🍕 Tenemos ${pizzas.length} pizzas artesanales. ¡Todas hechas con ingredientes frescos!`,
            ["Bebidas", "Hacer un pedido", "Ver menú completo"],
            buildSuggestions(pizzas)
          ));
        } else {
          push(mkMsg("bot", "Tenemos deliciosas pizzas artesanales. Ve al menú para verlas todas.", ["Ver el menú"]));
        }
        return;
      }

      // Drinks
      if (lower.includes("bebida") || lower.includes("tomar") || lower.includes("gaseosa") || lower.includes("agua")) {
        const drinks = menuItems?.filter((i) => i.category?.toLowerCase() === "bebida") ?? [];
        if (drinks.length > 0) {
          push(mkMsg("bot",
            `🥤 Tenemos ${drinks.length} bebidas disponibles:`,
            ["Pizzas", "Hacer un pedido"],
            buildSuggestions(drinks)
          ));
        } else {
          push(mkMsg("bot", "Tenemos bebidas frías disponibles. Ve al menú para verlas.", ["Ver el menú"]));
        }
        return;
      }

      // Delivery zone
      if (lower.includes("zona") || lower.includes("distrito") || lower.includes("reparto") || lower.includes("deliver") || lower.includes("llegamos") || lower.includes("llegan")) {
        push(mkMsg("bot",
          "🗺️ Hacemos delivery en Lima. Los distritos principales incluyen:\nMiraflores, San Isidro, Barranco, Surco, La Molina, Jesús María y más.\n\nSi tienes duda sobre tu zona, escríbenos por WhatsApp.",
          ["Hacer un pedido", "Hablar por WhatsApp"]
        ));
        return;
      }

      // Greeting
      if (lower.includes("hola") || lower.includes("buenas") || lower.includes("buen") || lower === "hi" || lower === "hello") {
        push(mkMsg("bot",
          "¡Hola! 😊 ¿Qué quieres ordenar hoy?",
          ["Ver pizzas", "Ver bebidas", "Hacer un pedido", "Ver precios"]
        ));
        return;
      }

      // Default
      push(mkMsg("bot",
        "No entendí muy bien tu mensaje 😅 ¿En qué te puedo ayudar?",
        ["Ver el menú", "Pizzas disponibles", "¿Cómo hacer un pedido?", "Precios", "Hablar con WhatsApp"]
      ));
    }, 600);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    processInput(input);
    setInput("");
  };

  const handleOption = (opt: string) => {
    const map: Record<string, string> = {
      "Ver el menú": "menú completo",
      "Ver menú completo": "menú completo",
      "Pizzas disponibles": "pizzas",
      "Ver pizzas": "pizzas",
      "Bebidas": "bebidas",
      "Ver bebidas": "bebidas",
      "¿Cómo hacer un pedido?": "¿cómo hago un pedido?",
      "Hacer un pedido": "¿cómo hago un pedido?",
      "Hablar con WhatsApp": "whatsapp",
      "Hablar por WhatsApp": "whatsapp",
      "¿Cuánto demora?": "¿cuánto demora el delivery?",
      "Ver precios": "precios",
      "Precios": "precios",
      "Inicio": "hola",
    };
    processInput(map[opt] ?? opt);
  };

  const handleAddToCart = (item: MenuSuggestion) => {
    addItem({
      menuItemId: item.menuItemId,
      name: item.name,
      category: item.category,
      size: item.size,
      sizeLabel: item.sizeLabel,
      quantity: 1,
      unitPrice: item.price,
    });
    toast({ title: `¡${item.name} agregado! 🍕`, description: "Revisa tu carrito para finalizar el pedido." });
    push(mkMsg("bot",
      `✅ Perfecto, agregué **${item.name}** a tu carrito. ¿Quieres agregar algo más?`,
      ["Ver más pizzas", "Ver bebidas", "Ir al carrito"]
    ));
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110 active:scale-95"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 3rem)", height: 560 }}>
          
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Pizza className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm">Asistente Tata Pizza</div>
                <div className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  En línea
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.from === "user" ? "" : "w-full"}`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                    msg.from === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-white text-foreground rounded-tl-sm shadow-sm border border-border"
                  }`}>
                    {msg.text}
                  </div>

                  {/* Menu item suggestions */}
                  {msg.items && msg.items.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.items.map((item) => (
                        <div key={item.menuItemId} className="bg-white border border-border rounded-xl p-2.5 flex items-center gap-2 shadow-sm">
                          <div className="text-2xl shrink-0">{CATEGORY_ICONS[item.category] ?? "🍽️"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{item.name}</div>
                            <div className="text-xs text-primary font-bold">S/.{(item.price / 100).toFixed(0)}</div>
                          </div>
                          <Show when="signed-in">
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="bg-primary text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-primary/90 transition-colors shrink-0"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Agregar
                            </button>
                          </Show>
                          <Show when="signed-out">
                            <a
                              href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-in`}
                              className="bg-primary text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-primary/90 transition-colors shrink-0"
                            >
                              + Agregar
                            </a>
                          </Show>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick options */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.options.map((opt) => {
                        if (opt === "Ir al carrito") {
                          return (
                            <Link key={opt} href="/cart">
                              <button
                                onClick={() => setOpen(false)}
                                className="text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors font-medium"
                              >
                                {opt}
                              </button>
                            </Link>
                          );
                        }
                        if (opt === "Ver menú completo") {
                          return (
                            <Link key={opt} href="/menu">
                              <button
                                onClick={() => setOpen(false)}
                                className="text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors font-medium"
                              >
                                {opt}
                              </button>
                            </Link>
                          );
                        }
                        if (opt === "Hablar con WhatsApp" || opt === "Hablar por WhatsApp") {
                          return (
                            <a key={opt} href="https://wa.me/51999999999" target="_blank" rel="noopener noreferrer">
                              <button className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-colors font-medium">
                                📱 WhatsApp
                              </button>
                            </a>
                          );
                        }
                        return (
                          <button
                            key={opt}
                            onClick={() => handleOption(opt)}
                            className="text-xs px-3 py-1.5 bg-muted text-foreground border border-border rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-white shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-primary text-white p-2 rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1.5">
              Asistente virtual · Tata Pizza Lima
            </p>
          </div>
        </div>
      )}
    </>
  );
}
