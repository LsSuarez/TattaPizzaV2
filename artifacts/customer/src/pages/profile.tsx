import { useEffect, useState } from "react";
import { User, Mail, Phone, Save, MapPin } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetMyProfile, useUpsertMyProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { data: profile, isLoading } = useGetMyProfile();
  const upsert = useUpsertMyProfile();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    } else if (clerkUser) {
      setName(`${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim());
    }
  }, [profile, clerkUser]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        data: {
          name: name || "Cliente",
          email: clerkUser?.primaryEmailAddress?.emailAddress ?? undefined,
          phone: phone || "---",
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "¡Perfil guardado! ✅", description: "Tu información ha sido actualizada." });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el perfil.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Mi Perfil
        </h1>

        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-border p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden">
            {clerkUser?.imageUrl ? (
              <img src={clerkUser.imageUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (name?.[0] ?? clerkUser?.firstName?.[0] ?? "U")
            )}
          </div>
          <div>
            <div className="font-bold text-lg">{name || clerkUser?.firstName}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {clerkUser?.primaryEmailAddress?.emailAddress}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold">Información personal</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan García"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label>Correo electrónico</Label>
                <Input
                  value={clerkUser?.primaryEmailAddress?.emailAddress ?? ""}
                  disabled
                  className="mt-1 rounded-xl bg-muted/50 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">El correo se gestiona desde tu cuenta.</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={upsert.isPending}
                className={`w-full rounded-xl flex items-center justify-center gap-2 ${saved ? "bg-green-500 hover:bg-green-500" : "bg-primary"} text-white`}
              >
                <Save className="w-4 h-4" />
                {upsert.isPending ? "Guardando..." : saved ? "¡Guardado!" : "Guardar cambios"}
              </Button>
            </>
          )}
        </div>

        {/* Addresses shortcut */}
        <Link href="/direcciones">
          <div className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between hover:shadow-sm transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Mis Direcciones</p>
                <p className="text-sm text-muted-foreground">Gestiona tus direcciones de entrega</p>
              </div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
