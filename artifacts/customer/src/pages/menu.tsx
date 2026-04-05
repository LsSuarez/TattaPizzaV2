import { useState } from "react";
import { Search, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useListMenuItems } from "@workspace/api-client-react";
import { type MenuItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@clerk/react";

const CATEGORY_ICONS: Record<string, string> = {
  Pizza: "🍕",
  pizza: "🍕",
  Bebida: "🥤",
  bebida: "🥤",
  Postre: "🍰",
  postre: "🍰",
  Complemento: "🧀",
  complemento: "🧀",
  Promocion: "⭐",
  promocion: "⭐",
};

const SIZES = [
  { key: "small" as const, label: "Personal", priceKey: "priceSmall" as const },
  { key: "medium" as const, label: "Mediana", priceKey: "priceMedium" as const },
  { key: "large" as const, label: "Grande", priceKey: "priceLarge" as const },
];

function MenuItemCard({ item }: { item: MenuItem }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large" | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();

  const availableSizes = SIZES.filter((s) => item[s.priceKey] != null);
  const isSingleSize = availableSizes.length === 1;

  const getPrice = () => {
    if (selectedSize) {
      const s = SIZES.find((s) => s.key === selectedSize);
      return s ? item[s.priceKey] : null;
    }
    if (isSingleSize && availableSizes[0]) {
      return item[availableSizes[0].priceKey];
    }
    return item.priceSmall ?? item.priceMedium ?? item.priceLarge;
  };

  const price = getPrice();
  const displayPrice = price != null ? `S/.${(price / 100).toFixed(0)}` : null;

  const handleAdd = () => {
    const size = isSingleSize ? (availableSizes[0]?.key ?? null) : selectedSize;
    if (!isSingleSize && !size) {
      toast({ title: "Selecciona el tamaño", description: "Elige un tamaño antes de agregar al carrito" });
      setExpanded(true);
      return;
    }
    const sizeObj = SIZES.find((s) => s.key === size);
    const unitPrice = size && sizeObj ? (item[sizeObj.priceKey] ?? 0) : (price ?? 0);
    addItem({
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      size,
      sizeLabel: isSingleSize ? "Única" : (sizeObj?.label ?? ""),
      quantity: 1,
      unitPrice,
    });
    toast({
      title: "¡Agregado al carrito!",
      description: `${item.name}${size && !isSingleSize ? ` - ${sizeObj?.label}` : ""} agregado`,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all">
      {/* Image area */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 h-44 flex items-center justify-center text-5xl">
        {CATEGORY_ICONS[item.category] ?? "🍽️"}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-foreground leading-tight">{item.name}</h3>
          <Badge variant="secondary" className="text-xs shrink-0">{item.category}</Badge>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
        )}

        {/* Size buttons */}
        {!isSingleSize && (
          <div className={`overflow-hidden transition-all ${expanded ? "max-h-40 mb-3" : "max-h-0"}`}>
            <p className="text-xs font-medium text-muted-foreground mb-2">Elige el tamaño:</p>
            <div className="flex gap-2 flex-wrap">
              {availableSizes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSize(s.key)}
                  className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedSize === s.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <div>{s.label}</div>
                  <div className="font-bold text-foreground">
                    S/.{((item[s.priceKey] ?? 0) / 100).toFixed(0)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price and action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              {isSingleSize ? "Precio" : (selectedSize ? "Seleccionado" : "Desde")}
            </div>
            <div className="font-bold text-primary text-lg">{displayPrice}</div>
          </div>
          <div className="flex gap-2">
            {!isSingleSize && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <Show when="signed-in">
              <Button
                onClick={handleAdd}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-1"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </Show>
            <Show when="signed-out">
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-in`}
                className="inline-flex items-center gap-1 bg-primary text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
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

export default function MenuPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const { data: items, isLoading } = useListMenuItems({ available: true });

  const categories = ["all", ...Array.from(new Set(items?.map((i) => i.category) ?? []))];
  const filtered = (items ?? []).filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchCategory = category === "all" || item.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">🍕 Nuestro Menú</h1>
          <p className="text-muted-foreground text-sm">Pizzas artesanales y más, hechas con ingredientes frescos</p>

          {/* Search */}
          <div className="relative mt-4 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar pizzas, bebidas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "all" ? "✨ Todos" : `${CATEGORY_ICONS[cat] ?? "🍽️"} ${cat}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Sin resultados</h3>
            <p className="text-muted-foreground">Intenta con otro término o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
