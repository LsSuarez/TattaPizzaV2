import { useState } from "react";
import { Search, Plus, Star, Flame, Tag, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useListMenuItems } from "@workspace/api-client-react";
import { type MenuItem } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@clerk/react";

/* ─── Image maps ─── */
const PIZZA_IMAGES: Record<string, string> = {
  default:   "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
  margarita: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
  pepperoni: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
  hawaiana:  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
  cuatro:    "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80",
  especial:  "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=80",
  pollo:     "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80",
};

const CAT_IMAGES: Record<string, string> = {
  pizza:      PIZZA_IMAGES.default,
  bebida:     "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
  postre:     "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80",
  lasaña:     "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80",
  lasagna:    "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80",
  snack:      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80",
  complemento:"https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80",
  entrada:    "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80",
};

function getItemImage(item: MenuItem): string {
  const cat = item.category?.toLowerCase() ?? "";
  if (cat === "pizza") {
    const name = item.name.toLowerCase();
    for (const [key, url] of Object.entries(PIZZA_IMAGES)) {
      if (key !== "default" && name.includes(key)) return url;
    }
    return PIZZA_IMAGES.default;
  }
  return CAT_IMAGES[cat] ?? "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80";
}

const CAT_ICONS: Record<string, string> = {
  pizza: "🍕", bebida: "🥤", postre: "🍰",
  lasaña: "🍝", lasagna: "🍝", snack: "🥨",
  complemento: "🧀", entrada: "🥗", all: "✨",
};

const SIZES = [
  { key: "small"  as const, label: "Personal", price: "priceSmall"  as const },
  { key: "medium" as const, label: "Mediana",  price: "priceMedium" as const },
  { key: "large"  as const, label: "Familiar", price: "priceLarge"  as const },
];

/* ─── Menu item card ─── */
function MenuCard({ item }: { item: MenuItem }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected]  = useState<"small"|"medium"|"large"|null>(null);
  const { addItem } = useCart();
  const { toast }   = useToast();

  const sizes = SIZES.filter((s) => item[s.price] != null);
  const single = sizes.length === 1;

  const price = selected
    ? (item[SIZES.find((s) => s.key === selected)!.price] ?? 0)
    : (item.priceSmall ?? item.priceMedium ?? item.priceLarge ?? 0);

  const handleAdd = () => {
    const size = single ? (sizes[0]?.key ?? null) : selected;
    if (!single && !size) {
      toast({ title: "Elige el tamaño", description: "Selecciona Personal, Mediana o Familiar" });
      setExpanded(true);
      return;
    }
    const sizeObj = SIZES.find((s) => s.key === size);
    addItem({
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      size,
      sizeLabel: single ? "Única" : (sizeObj?.label ?? ""),
      quantity: 1,
      unitPrice: size && sizeObj ? (item[sizeObj.price] ?? 0) : price,
    });
    toast({ title: `${item.name} agregado 🍕`, description: `+${size && !single ? sizeObj?.label : ""}` });
  };

  const imgUrl = getItemImage(item);
  const cat = item.category?.toLowerCase() ?? "";

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      {/* Image */}
      <div className="relative h-52 overflow-hidden shrink-0">
        <img
          src={imgUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {CAT_ICONS[cat] ?? "🍽"} {item.category}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-primary text-white text-sm font-black px-3 py-1 rounded-full shadow-lg">
            S/.{(price / 100).toFixed(0)}
          </span>
        </div>

        {/* Stars */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-white text-xs ml-1 font-medium drop-shadow">5.0</span>
        </div>

        {cat === "pizza" && (
          <div className="absolute bottom-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3" /> Artesanal
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-extrabold text-gray-900 text-base leading-tight">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed flex-1">{item.description}</p>
        )}

        {/* Size selector (multi-size) */}
        {!single && (
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-32 mt-3" : "max-h-0"}`}>
            <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">Elige tamaño:</p>
            <div className="grid grid-cols-3 gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelected(s.key)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl border-2 transition-all text-xs ${
                    selected === s.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="font-semibold">{s.label}</span>
                  <span className={`font-black ${selected === s.key ? "text-primary" : "text-gray-800"}`}>
                    S/.{((item[s.price] ?? 0) / 100).toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price row + actions */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex-1">
            {single ? (
              <div>
                <p className="text-xs text-gray-400">Precio único</p>
                <p className="font-black text-primary text-2xl leading-none">
                  S/.{(price / 100).toFixed(0)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400">{selected ? "Seleccionado" : "Desde"}</p>
                <p className="font-black text-primary text-2xl leading-none">
                  S/.{(price / 100).toFixed(0)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!single && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2.5 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-500 transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <Show when="signed-in">
              <button
                onClick={handleAdd}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </Show>
            <Show when="signed-out">
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-in`}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </a>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function MenuPage() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("all");
  const { data: items, isLoading } = useListMenuItems({ available: true });

  const raw = items ?? [];
  const categories = ["all", ...Array.from(new Set(raw.map((i) => i.category?.toLowerCase() ?? "otro")))];

  const filtered = raw.filter((item) => {
    const q = search.toLowerCase();
    const matchQ = item.name.toLowerCase().includes(q) ||
      (item.description?.toLowerCase().includes(q) ?? false);
    const matchC = category === "all" || item.category?.toLowerCase() === category;
    return matchQ && matchC;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header banner */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1400&q=80"
          alt="Menu"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-5xl font-black mb-2">
            🍕 Nuestro Menú
          </h1>
          <p className="text-gray-300 max-w-lg">
            Pizzas artesanales, lasañas, snacks, bebidas y más. Todo hecho al momento con ingredientes frescos.
          </p>

          {/* Promo pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            <span className="bg-yellow-400 text-gray-900 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1">
              🔥 Martes 3x1
            </span>
            <span className="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1">
              ⭐ Jueves 5x2
            </span>
            <span className="bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1">
              📦 Delivery gratis +S/.80
            </span>
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar pizzas, lasañas, bebidas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => {
              const icon = CAT_ICONS[cat] ?? "🍽";
              const label = cat === "all" ? "Todos" : cat.charAt(0).toUpperCase() + cat.slice(1);
              const count = cat === "all" ? raw.length : raw.filter((i) => i.category?.toLowerCase() === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    category === cat
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${category === cat ? "bg-white/20" : "bg-gray-200"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Sin resultados</h3>
            <p className="text-gray-500">Intenta con otro término o categoría</p>
            <button onClick={() => { setSearch(""); setCategory("all"); }} className="mt-6 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
              Ver todo el menú
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm font-medium">
                <span className="font-black text-gray-900">{filtered.length}</span> productos disponibles
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-primary/5 border-t border-primary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-black text-gray-900 mb-2">¿No encuentras lo que buscas?</h3>
          <p className="text-gray-500 text-sm mb-6">Contáctanos por WhatsApp — hacemos pedidos especiales y personalizados.</p>
          <a
            href="https://wa.me/51999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105"
          >
            💬 Pedir algo especial por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
