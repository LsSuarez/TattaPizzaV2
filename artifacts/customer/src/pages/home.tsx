import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Pizza, Clock, Star, MapPin, MessageCircle, Zap, ShieldCheck,
  Instagram, Facebook, ChevronRight, Phone, Flame, Gift, Sparkles,
  TrendingUp, Heart, Award
} from "lucide-react";
import { useListMenuItems } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ─── Image maps ─── */
const PIZZA_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
  margarita: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
  pepperoni: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
  hawaiana: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
  cuatro: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80",
  familiar: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=80",
};
const DRINK_IMG = "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80";
const LASAGNA_IMG = "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80";
const SNACK_IMG = "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80";
const PROMO_IMG = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80";

function getPizzaImage(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(PIZZA_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return PIZZA_IMAGES.default;
}

/* ─── Promo ticker ─── */
const PROMOS = [
  { emoji: "🔥", text: "MARTES 3x1 — ¡Pide 3 pizzas personales y paga 1!" },
  { emoji: "⭐", text: "JUEVES 5x2 — ¡5 pizzas al precio de 2!" },
  { emoji: "🍕", text: "PEDIDO ESPECIAL — Pizza Super Familiar: hasta 8 personas" },
  { emoji: "📦", text: "DELIVERY GRATIS — En pedidos mayores a S/.80" },
  { emoji: "💳", text: "PAGA CON YAPE — Sin comisión adicional" },
];

function PromoTicker() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PROMOS.length);
        setFade(true);
      }, 300);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const p = PROMOS[idx];
  return (
    <div className="bg-yellow-400 text-gray-900 py-2 px-4 text-center text-sm font-bold overflow-hidden">
      <span
        className="transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {p.emoji} {p.text}
      </span>
    </div>
  );
}

/* ─── Featured product card ─── */
function FeaturedCard({ item }: { item: NonNullable<ReturnType<typeof useListMenuItems>["data"]>[number] }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(false);
  const price = item.priceSmall ?? item.priceMedium ?? item.priceLarge ?? 0;
  const cat = item.category?.toLowerCase() ?? "";
  const imgUrl = cat === "pizza" ? getPizzaImage(item.name) :
    cat === "bebida" ? DRINK_IMG :
    cat === "lasaña" || cat === "lasagna" ? LASAGNA_IMG : SNACK_IMG;

  const handleAdd = () => {
    const size = item.priceSmall ? "small" : item.priceMedium ? "medium" : "large";
    addItem({
      menuItemId: item.id, name: item.name, category: item.category,
      size: size, sizeLabel: "Personal", quantity: 1, unitPrice: price,
    });
    toast({ title: `¡${item.name} agregado! 🍕` });
  };

  return (
    <div
      className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={imgUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          S/.{(price / 100).toFixed(0)}
        </div>
        {item.category?.toLowerCase() === "pizza" && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
            🍕 Artesanal
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-gray-900 text-base leading-tight">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Desde</p>
            <p className="font-black text-primary text-xl">S/.{(price / 100).toFixed(0)}</p>
          </div>
          <Show when="signed-in">
            <button
              onClick={handleAdd}
              className="bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
            >
              + Agregar
            </button>
          </Show>
          <Show when="signed-out">
            <Link href="/menu">
              <button className="bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-2xl hover:bg-primary/90 transition-all">
                Ver más
              </button>
            </Link>
          </Show>
        </div>
      </div>
    </div>
  );
}

/* ─── Promotion card ─── */
function PromoCard({ day, deal, color, emoji, description }: {
  day: string; deal: string; color: string; emoji: string; description: string;
}) {
  return (
    <div className={`relative rounded-3xl overflow-hidden ${color} text-white p-6 flex flex-col justify-between min-h-52 shadow-xl`}>
      <div className="absolute right-4 top-4 text-7xl opacity-20 select-none">{emoji}</div>
      <div>
        <span className="text-sm font-bold uppercase tracking-widest opacity-80">{day}</span>
        <h3 className="text-4xl font-black mt-1 leading-none">{deal}</h3>
        <p className="text-base font-semibold mt-2 opacity-90">{description}</p>
      </div>
      <Link href="/menu">
        <button className="mt-4 self-start bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
          Pedir ahora <ChevronRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}

/* ─── Category pill ─── */
function CategoryCard({ emoji, label, image, href }: {
  emoji: string; label: string; image: string; href: string;
}) {
  return (
    <Link href={href}>
      <div className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 aspect-square">
        <img src={image} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <div className="text-3xl">{emoji}</div>
          <p className="text-white font-extrabold text-sm mt-0.5 drop-shadow">{label}</p>
        </div>
      </div>
    </Link>
  );
}

/* ─── MAIN PAGE ─── */
export default function HomePage() {
  const { data: menuItems } = useListMenuItems({ available: true });
  const featuredPizzas = menuItems?.filter((i) => i.category?.toLowerCase() === "pizza").slice(0, 4) ?? [];
  const allFeatured = menuItems?.filter((i) =>
    ["pizza","bebida","lasaña","lasagna","snack","complemento"].includes(i.category?.toLowerCase() ?? "")
  ).slice(0, 8) ?? [];

  const today = new Date().getDay(); // 0=Sun,1=Mon,2=Tue,...

  return (
    <div className="min-h-screen bg-gray-50">
      <PromoTicker />
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&q=80"
            alt="Pizza artesanal Tata Pizza"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 rounded-full px-4 py-1.5 text-sm font-bold mb-6 shadow-lg">
              <MapPin className="w-4 h-4" />
              Lima, Perú · Delivery y Recojo
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6">
              La pizza que<br />
              <span className="text-yellow-400">amas</span>,<br />
              a tu puerta
            </h1>

            <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Pizzas artesanales hechas con ingredientes frescos, hornadas al momento. Pedido en 2 minutos — listo en 30.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-10">
              {[
                { icon: Clock, text: "30–45 min" },
                { icon: Star, text: "4.9 ⭐ (500+ pedidos)" },
                { icon: Flame, text: "Horno de leña" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <Icon className="w-4 h-4 text-yellow-400" />
                  {text}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/menu">
                <button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95">
                  🍕 Ordenar ahora
                </button>
              </Link>
              <a href={`${basePath}/sign-up`}>
                <button className="w-full sm:w-auto border-2 border-white/40 text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                  Crear cuenta gratis
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* Floating promo badge */}
        {today === 2 && ( // Tuesday
          <div className="absolute top-24 right-6 md:right-16 bg-yellow-400 text-gray-900 rounded-3xl px-6 py-4 shadow-2xl text-center rotate-3 hidden md:block">
            <p className="text-4xl font-black">3x1</p>
            <p className="font-bold text-sm">¡HOY MARTES!</p>
          </div>
        )}
        {today === 4 && ( // Thursday
          <div className="absolute top-24 right-6 md:right-16 bg-primary text-white rounded-3xl px-6 py-4 shadow-2xl text-center -rotate-3 hidden md:block">
            <p className="text-4xl font-black">5x2</p>
            <p className="font-bold text-sm">¡HOY JUEVES!</p>
          </div>
        )}
      </section>

      {/* ═══ STATS BAR ═══ */}
      <div className="bg-primary text-white py-5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: Award, label: "Pizzas artesanales", value: "100%" },
            { icon: Clock, label: "Tiempo promedio", value: "35 min" },
            { icon: Heart, label: "Clientes felices", value: "500+" },
            { icon: Flame, label: "Hornadas diarias", value: "50+" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="w-5 h-5 text-yellow-300" />
              <span className="text-2xl font-black">{value}</span>
              <span className="text-xs text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ PROMOTIONS ═══ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Promociones</h2>
              <p className="text-gray-500 text-sm">Ofertas exclusivas de la semana</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <PromoCard
              day="Todos los Martes"
              deal="3 × 1"
              color="bg-gradient-to-br from-orange-500 to-red-600"
              emoji="🍕"
              description="3 pizzas personales al precio de 1. Elige sabores diferentes."
            />
            <PromoCard
              day="Todos los Jueves"
              deal="5 × 2"
              color="bg-gradient-to-br from-purple-600 to-indigo-700"
              emoji="⭐"
              description="5 pizzas personales al precio de 2. El mejor día para el antojo."
            />
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 p-6 flex flex-col justify-between min-h-52 shadow-xl">
              <div className="absolute right-4 top-4 text-7xl opacity-20 select-none">📦</div>
              <div>
                <span className="text-sm font-bold uppercase tracking-widest opacity-70">Pedido Especial</span>
                <h3 className="text-3xl font-black mt-1 leading-tight">Pizza<br />Super Familiar</h3>
                <p className="text-sm font-semibold mt-2 opacity-80">Hasta 8 personas · Tamaño XXL · A pedido con 2h de anticipación</p>
              </div>
              <a href={`https://wa.me/51999999999?text=Hola!+Quiero+hacer+un+pedido+especial+de+pizza+super+familiar`} target="_blank" rel="noopener noreferrer">
                <button className="mt-4 bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors hover:bg-gray-800 flex items-center gap-2">
                  Pedir por WhatsApp <ChevronRight className="w-4 h-4" />
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Explora el Menú</h2>
            <p className="text-gray-500 mt-2">Todo hecho con ingredientes frescos y de calidad</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <CategoryCard emoji="🍕" label="Pizzas" image="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80" href="/menu" />
            <CategoryCard emoji="🍝" label="Lasañas" image="https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80" href="/menu" />
            <CategoryCard emoji="🥗" label="Snacks" image="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80" href="/menu" />
            <CategoryCard emoji="🥤" label="Bebidas" image="https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" href="/menu" />
            <CategoryCard emoji="🍰" label="Postres" image="https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80" href="/menu" />
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ═══ */}
      {allFeatured.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900">Más Pedidos</h2>
                  <p className="text-gray-500 text-sm">Los favoritos de Lima</p>
                </div>
              </div>
              <Link href="/menu">
                <button className="border-2 border-gray-200 hover:border-primary text-gray-600 hover:text-primary font-bold px-5 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
                  Ver todo <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allFeatured.map((item) => (
                <FeaturedCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ SPECIAL ORDER ═══ */}
      <section className="py-16 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=1400&q=80"
            alt="Pizza super familiar"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                🌟 Pedido Especial
              </span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                Pizza Super<br />
                <span className="text-yellow-400">Familiar XXL</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                ¿Reunión familiar, cumpleaños, evento? Tenemos la pizza más grande de Lima. Feeds hasta <strong className="text-white">8 personas</strong>. Disponible en todos nuestros sabores, con pedido previo de 2 horas.
              </p>
              <ul className="space-y-2 mb-8 text-gray-300">
                {["Tamaño XXL — 60 cm de diámetro", "Cualquier combinación de ingredientes", "Precio especial desde S/.120", "Entrega gratuita en pedidos +S/.100"].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/51999999999?text=Hola!+Quiero+pedir+una+pizza+super+familiar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-7 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" />
                  Pedir por WhatsApp
                </a>
                <a href={`tel:+51999999999`} className="border-2 border-white/30 hover:border-white text-white font-bold px-7 py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                  <Phone className="w-5 h-5" />
                  Llamar ahora
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="w-80 h-80 mx-auto rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl shadow-yellow-400/20">
                  <img
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"
                    alt="Pizza familiar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 rounded-2xl px-4 py-2 font-black shadow-lg">
                  Hasta 8 personas 🍕
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">¿Cómo funciona?</h2>
          <p className="text-gray-500 mb-12">Pedir tu pizza nunca fue tan fácil</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
            {[
              { step: "01", icon: "🛒", title: "Elige tus pizzas", desc: "Explora el menú y agrega al carrito tus favoritas. También puedes chatear con nuestro asistente." },
              { step: "02", icon: "💳", title: "Confirma y paga", desc: "Elige delivery o recojo. Paga con Yape, transferencia bancaria o efectivo al recibir." },
              { step: "03", icon: "🛵", title: "¡Recibe tu pizza!", desc: "Seguimiento en tiempo real desde que sale de cocina hasta que llega a tu puerta." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative z-10">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm">
                  {icon}
                </div>
                <div className="text-xs font-black text-primary/40 uppercase tracking-widest mb-2">Paso {step}</div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/menu">
              <button className="bg-primary hover:bg-primary/90 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all hover:scale-105">
                Ordenar ahora 🍕
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL MEDIA ═══ */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Síguenos en redes</h2>
          <p className="text-gray-400 mb-10">Mira nuestras últimas creaciones y promociones exclusivas</p>

          {/* Social grid fake-instagram */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-10 max-w-3xl mx-auto">
            {[
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80",
              "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&q=80",
              "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80",
              "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&q=80",
              "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=200&q=80",
              "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=200&q=80",
            ].map((src, i) => (
              <a key={i} href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://instagram.com/tatapizza"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-7 py-3 rounded-2xl transition-all hover:scale-105"
            >
              <Instagram className="w-5 h-5" />
              Instagram · @tatapizza
            </a>
            <a
              href="https://facebook.com/tatapizza"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3 rounded-2xl transition-all hover:scale-105"
            >
              <Facebook className="w-5 h-5" />
              Facebook · Tata Pizza
            </a>
            <a
              href="https://tiktok.com/@tatapizza"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white font-bold px-7 py-3 rounded-2xl transition-all hover:scale-105"
            >
              <span className="text-lg">🎵</span>
              TikTok · @tatapizza
            </a>
            <a
              href="https://wa.me/51999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-7 py-3 rounded-2xl transition-all hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Pizza className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-white text-xl">Tata Pizza</span>
              </div>
              <p className="text-sm leading-relaxed">Pizzas artesanales horneadas con amor. Lima, Perú.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Menú</h4>
              <ul className="space-y-2 text-sm">
                {["Pizzas", "Lasañas", "Snacks & Complementos", "Bebidas", "Postres"].map((i) => (
                  <li key={i}><Link href="/menu" className="hover:text-white transition-colors">{i}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Promociones</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="text-yellow-400">🔥</span> Martes 3x1 pizzas</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400">⭐</span> Jueves 5x2 pizzas</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400">📦</span> Pizza Super Familiar XXL</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400">🛵</span> Delivery gratis +S/.80</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Horario</h4>
              <ul className="space-y-2 text-sm">
                <li>Lun–Dom: 12:00 – 23:00</li>
                <li className="flex items-center gap-2 mt-2 text-green-400 font-semibold">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Abierto ahora
                </li>
                <li className="mt-4">
                  <a href="tel:+51999999999" className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors font-bold">
                    <Phone className="w-4 h-4" />
                    +51 999 999 999
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs">© {new Date().getFullYear()} Tata Pizza · Lima, Perú · Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="https://instagram.com/tatapizza" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://facebook.com/tatapizza" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://wa.me/51999999999" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><MessageCircle className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
