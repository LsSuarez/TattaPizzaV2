import { Link } from "wouter";
import { Pizza, Clock, Star, MapPin, MessageCircle, Zap, ShieldCheck } from "lucide-react";
import { useListMenuItems } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PIZZA_EMOJIS = ["🍕", "🧀", "🍅", "🌿", "🔥", "⭐"];

function FeaturedItem({ name, description, price }: { name: string; description: string; price: number }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-all group">
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 h-40 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
        🍕
      </div>
      <div className="p-4">
        <h3 className="font-bold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-primary text-lg">
            Desde S/.{(price / 100).toFixed(0)}
          </span>
          <Link href="/menu">
            <Button size="sm" className="bg-primary text-white rounded-xl">Ver más</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: menuItems } = useListMenuItems({ available: true });
  const featuredPizzas = menuItems?.filter((i) => i.category?.toLowerCase() === "pizza").slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {PIZZA_EMOJIS.map((e, i) => (
            <span
              key={i}
              className="absolute text-4xl animate-pulse"
              style={{
                top: `${10 + i * 15}%`,
                left: `${5 + i * 16}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm mb-6">
              <MapPin className="w-4 h-4" />
              Lima, Perú · Delivery y Recojo
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              La pizza que<br />
              <span className="text-yellow-300">amas</span>, a tu puerta
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Ordena online en minutos. Pizzas artesanales hechas con los mejores ingredientes. ¡Paga con Yape, transferencia o contra entrega!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/menu">
                <Button size="lg" className="bg-white text-primary hover:bg-yellow-50 font-bold text-lg px-8 py-6 rounded-2xl w-full sm:w-auto">
                  🍕 Ver el Menú
                </Button>
              </Link>
              <a href={`${basePath}/sign-up`}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 rounded-2xl w-full sm:w-auto">
                  Registrarse gratis
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Pedido rápido", desc: "Haz tu pedido en menos de 2 minutos desde el chat o menú online" },
              { icon: ShieldCheck, title: "Pago seguro", desc: "Acepta Yape/Plin, transferencia bancaria y pago contra entrega" },
              { icon: Clock, title: "Seguimiento en vivo", desc: "Monitorea el estado de tu pedido en tiempo real, desde cocina hasta tu puerta" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured pizzas */}
      {featuredPizzas.length > 0 && (
        <section className="py-14 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">⭐ Más Populares</h2>
                <p className="text-muted-foreground mt-1">Las favoritas de Lima</p>
              </div>
              <Link href="/menu">
                <Button variant="outline" className="rounded-xl">Ver todo el menú</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPizzas.map((item) => (
                <FeaturedItem
                  key={item.id}
                  name={item.name}
                  description={item.description ?? "Pizza artesanal"}
                  price={item.priceSmall ?? item.priceMedium ?? item.priceLarge ?? 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className="py-14 bg-primary/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">¿Prefieres ordenar por WhatsApp?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Nuestro asistente inteligente toma tu pedido 24/7 por WhatsApp. Solo dile qué pizzas quieres y listo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/51999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold px-8 py-4 rounded-2xl hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Ordenar por WhatsApp
            </a>
            <Link href="/menu">
              <Button size="lg" variant="outline" className="rounded-2xl px-8 py-6 h-auto">
                Ver menú y ordenar aquí
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Pizza className="w-5 h-5 text-primary" />
            <span className="font-bold text-white">Tata Pizza</span>
          </div>
          <p className="text-sm">Lima, Perú · {new Date().getFullYear()}</p>
          <p className="text-xs mt-2 text-white/50">Lunes a Domingo: 12:00 - 23:00</p>
        </div>
      </footer>
    </div>
  );
}
