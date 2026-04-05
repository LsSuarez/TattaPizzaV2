import { useState } from "react";
import { useListMenuItems, useUpdateMenuItem, useCreateMenuItem, getListMenuItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { data: menuItems, isLoading } = useListMenuItems();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMenu = useUpdateMenuItem();

  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleToggleAvailable = (id: number, currentAvailable: boolean) => {
    updateMenu.mutate({ id, data: { available: !currentAvailable } }, {
      onSuccess: () => {
        queryClient.setQueryData(getListMenuItemsQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((item: any) => item.id === id ? { ...item, available: !currentAvailable } : item);
        });
        toast({ title: "Menu updated", description: "Item availability changed." });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage products, pricing, and availability.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="btn-add-item">
          <Plus className="mr-2 h-4 w-4" /> Add Menu Item
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                className="pl-9 bg-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-menu"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="pizza">Pizzas</SelectItem>
                  <SelectItem value="bebida">Bebidas</SelectItem>
                  <SelectItem value="extra">Extras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price (Small)</TableHead>
                <TableHead className="text-right">Price (Medium)</TableHead>
                <TableHead className="text-right">Price (Large)</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No menu items found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className={!item.available ? "opacity-60 bg-muted/20" : ""}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize inline-flex items-center rounded-md bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary ring-1 ring-inset ring-secondary/20">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{item.priceSmall ? formatMoney(item.priceSmall) : "-"}</TableCell>
                    <TableCell className="text-right font-medium">{item.priceMedium ? formatMoney(item.priceMedium) : "-"}</TableCell>
                    <TableCell className="text-right">{item.priceLarge ? formatMoney(item.priceLarge) : "-"}</TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={item.available} 
                        onCheckedChange={() => handleToggleAvailable(item.id, item.available)}
                        disabled={updateMenu.isPending}
                        data-testid={`switch-available-${item.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)} data-testid={`btn-edit-item-${item.id}`}>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ItemDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        mode="create" 
      />
      
      <ItemDialog 
        open={!!editingItem} 
        onOpenChange={(open) => !open && setEditingItem(null)} 
        item={editingItem}
        mode="edit" 
      />
    </div>
  );
}

function ItemDialog({ open, onOpenChange, item, mode }: any) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "pizza");
  const [description, setDescription] = useState(item?.description || "");
  const [priceSmall, setPriceSmall] = useState(item?.priceSmall ? (item.priceSmall / 100).toString() : "");
  const [priceMedium, setPriceMedium] = useState(item?.priceMedium ? (item.priceMedium / 100).toString() : "");
  const [priceLarge, setPriceLarge] = useState(item?.priceLarge ? (item.priceLarge / 100).toString() : "");
  
  const createMenu = useCreateMenuItem();
  const updateMenu = useUpdateMenuItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isPending = createMenu.isPending || updateMenu.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      name,
      category,
      description: description || null,
      priceSmall: priceSmall ? Math.round(parseFloat(priceSmall) * 100) : null,
      priceMedium: priceMedium ? Math.round(parseFloat(priceMedium) * 100) : null,
      priceLarge: priceLarge ? Math.round(parseFloat(priceLarge) * 100) : null,
      available: item?.available ?? true
    };

    if (mode === "create") {
      createMenu.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
          toast({ title: "Success", description: "Menu item created" });
          onOpenChange(false);
          // reset form
          setName(""); setCategory("pizza"); setDescription(""); setPriceSmall(""); setPriceMedium(""); setPriceLarge("");
        }
      });
    } else {
      updateMenu.mutate({ id: item.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
          toast({ title: "Success", description: "Menu item updated" });
          onOpenChange(false);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add Menu Item" : "Edit Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required data-testid="input-item-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pizza">Pizza</SelectItem>
                  <SelectItem value="bebida">Bebida</SelectItem>
                  <SelectItem value="extra">Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priceSmall">Price Small (S/.)</Label>
                <Input id="priceSmall" type="number" step="0.01" min="0" value={priceSmall} onChange={e => setPriceSmall(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceMedium">Price Med (S/.)</Label>
                <Input id="priceMedium" type="number" step="0.01" min="0" value={priceMedium} onChange={e => setPriceMedium(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceLarge">Price Large (S/.)</Label>
                <Input id="priceLarge" type="number" step="0.01" min="0" value={priceLarge} onChange={e => setPriceLarge(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} data-testid="btn-save-item">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
