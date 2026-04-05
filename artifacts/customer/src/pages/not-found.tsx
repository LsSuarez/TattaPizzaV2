import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-8xl mb-6">🍕</div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Página no encontrada</h2>
        <p className="text-muted-foreground mb-8">
          Esta página se la comió la pizza. Regresa al menú principal.
        </p>
        <Link href="/menu">
          <Button className="bg-primary text-white rounded-xl px-8">Ir al Menú</Button>
        </Link>
      </div>
    </div>
  );
}
