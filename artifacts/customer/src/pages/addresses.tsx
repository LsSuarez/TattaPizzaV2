import { useState } from "react";
import { MapPin, Plus, Trash2, Star, Edit3, Check, X } from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetMyAddresses, useCreateMyAddress, useUpdateMyAddress, useDeleteMyAddress } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface AddressForm {
  label: string;
  address: string;
  district: string;
  reference: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = { label: "", address: "", district: "", reference: "", isDefault: false };

export default function AddressesPage() {
  const { data: addresses, isLoading, refetch } = useGetMyAddresses();
  const createAddress = useCreateMyAddress();
  const updateAddress = useUpdateMyAddress();
  const deleteAddress = useDeleteMyAddress();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const handleSave = async () => {
    if (!form.label || !form.address) {
      toast({ title: "Campos requeridos", description: "Escribe el nombre y la dirección.", variant: "destructive" });
      return;
    }
    try {
      if (editingId != null) {
        await updateAddress.mutateAsync({ id: editingId, data: { label: form.label, address: form.address, district: form.district || undefined, reference: form.reference || undefined, isDefault: form.isDefault } });
        toast({ title: "Dirección actualizada ✅" });
      } else {
        await createAddress.mutateAsync({ data: { label: form.label, address: form.address, district: form.district || undefined, reference: form.reference || undefined, isDefault: form.isDefault } });
        toast({ title: "Dirección agregada ✅" });
      }
      refetch();
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la dirección.", variant: "destructive" });
    }
  };

  const handleEdit = (addr: NonNullable<typeof addresses>[number]) => {
    setForm({
      label: addr.label ?? "",
      address: addr.address,
      district: addr.district ?? "",
      reference: addr.reference ?? "",
      isDefault: addr.isDefault ?? false,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta dirección?")) return;
    try {
      await deleteAddress.mutateAsync({ id });
      refetch();
      toast({ title: "Dirección eliminada" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleSetDefault = async (addr: NonNullable<typeof addresses>[number]) => {
    try {
      await updateAddress.mutateAsync({ id: addr.id, data: { isDefault: true } });
      refetch();
      toast({ title: "Dirección predeterminada actualizada ✅" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Mis Direcciones
          </h1>
          {!showForm && (
            <Button
              onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
              className="bg-primary text-white rounded-xl gap-1"
              size="sm"
            >
              <Plus className="w-4 h-4" /> Nueva
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{editingId ? "Editar dirección" : "Nueva dirección"}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <Label htmlFor="label">Nombre de la dirección*</Label>
              <Input id="label" placeholder="Casa, Trabajo..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="address">Dirección completa*</Label>
              <Input id="address" placeholder="Av. Larco 123, Miraflores" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="district">Distrito</Label>
              <Input id="district" placeholder="Miraflores" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="reference">Referencia</Label>
              <Input id="reference" placeholder="Frente al parque, piso 3..." value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">Marcar como predeterminada</Label>
            </div>
            <Button
              onClick={handleSave}
              disabled={createAddress.isPending || updateAddress.isPending}
              className="w-full bg-primary text-white rounded-xl gap-2"
            >
              <Check className="w-4 h-4" />
              {createAddress.isPending || updateAddress.isPending ? "Guardando..." : "Guardar dirección"}
            </Button>
          </div>
        )}

        {/* Addresses list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border h-24 animate-pulse" />
            ))}
          </div>
        ) : !addresses || addresses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-border">
            <div className="text-5xl mb-3">📍</div>
            <h3 className="font-semibold mb-1">Sin direcciones guardadas</h3>
            <p className="text-sm text-muted-foreground">Agrega una dirección para agilizar tus pedidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className={`bg-white rounded-2xl border-2 p-5 transition-all ${addr.isDefault ? "border-primary" : "border-border"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Predeterminada</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{addr.address}{addr.district ? `, ${addr.district}` : ""}</p>
                    {addr.reference && <p className="text-xs text-muted-foreground">Ref: {addr.reference}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(addr)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr)}
                    className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors mt-2"
                  >
                    <Star className="w-3 h-3" />
                    Marcar como predeterminada
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
