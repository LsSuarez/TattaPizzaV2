import { Router } from "express";
import { db } from "@workspace/db";
import {
  customersTable,
  ordersTable,
  orderItemsTable,
  addressesTable,
  ratingsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../../middlewares/requireAuth";

const portalRouter = Router();

portalRouter.use(requireAuth);

async function getOrCreateCustomer(clerkUserId: string, data?: { name?: string; phone?: string; email?: string }) {
  const [existing] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.clerkUserId, clerkUserId));
  if (existing) return existing;
  if (!data?.name || !data?.phone) return null;
  const [created] = await db
    .insert(customersTable)
    .values({ clerkUserId, name: data.name, phone: data.phone, email: data.email ?? null })
    .returning();
  return created;
}

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const [rating] = await db.select().from(ratingsTable).where(eq(ratingsTable.orderId, orderId));
  return { ...order, items, rating: rating ?? null };
}

portalRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkUserId, clerkUserId));
    if (!customer) {
      res.json({ isProfileComplete: false });
      return;
    }
    res.json({
      id: customer.id,
      clerkUserId: customer.clerkUserId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      isProfileComplete: !!(customer.name && customer.phone),
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

portalRouter.post("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { name, email, phone, address } = req.body;
    if (!name || !phone) {
      res.status(400).json({ error: "Nombre y teléfono son obligatorios" });
      return;
    }
    const [existing] = await db.select().from(customersTable).where(eq(customersTable.clerkUserId, clerkUserId));
    if (existing) {
      const [updated] = await db
        .update(customersTable)
        .set({ name, email: email ?? null, phone, address: address ?? null })
        .where(eq(customersTable.clerkUserId, clerkUserId))
        .returning();
      res.json({ ...updated, isProfileComplete: true });
    } else {
      const [created] = await db
        .insert(customersTable)
        .values({ clerkUserId, name, email: email ?? null, phone, address: address ?? null })
        .onConflictDoUpdate({
          target: customersTable.phone,
          set: { clerkUserId, name, email: email ?? null, address: address ?? null },
        })
        .returning();
      res.json({ ...created, isProfileComplete: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al guardar perfil" });
  }
});

portalRouter.get("/orders", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.clerkUserId, clerkUserId))
      .orderBy(desc(ordersTable.createdAt));
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
        const [rating] = await db.select().from(ratingsTable).where(eq(ratingsTable.orderId, order.id));
        return { ...order, items, rating: rating ?? null };
      }),
    );
    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

portalRouter.post("/orders", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkUserId, clerkUserId));
    if (!customer) {
      res.status(400).json({ error: "Debes completar tu perfil antes de hacer un pedido" });
      return;
    }
    const { deliveryAddress, deliveryType, paymentMethod, notes, items } = req.body;
    if (!items || items.length === 0) {
      res.status(400).json({ error: "El pedido debe tener al menos un producto" });
      return;
    }
    const total = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);
    const isCardPayment = paymentMethod === "IZIPAY_CARD";
    const [order] = await db
      .insert(ordersTable)
      .values({
        clerkUserId,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email ?? null,
        deliveryAddress: deliveryAddress ?? null,
        deliveryType: deliveryType ?? "delivery",
        paymentMethod: paymentMethod ?? "CASH_ON_DELIVERY",
        paymentStatus: isCardPayment ? "AWAITING_PAYMENT" : "PENDING",
        status: isCardPayment ? "RECIBIDO" : "RECIBIDO",
        total,
        notes: notes ?? null,
      })
      .returning();
    const orderItems = await Promise.all(
      items.map((item: { menuItemId?: number; name: string; size?: string; quantity: number; unitPrice: number }) =>
        db
          .insert(orderItemsTable)
          .values({
            orderId: order.id,
            menuItemId: item.menuItemId ?? null,
            name: item.name,
            size: item.size ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })
          .returning(),
      ),
    );
    res.status(201).json({ ...order, items: orderItems.flat(), rating: null });
  } catch (err) {
    res.status(500).json({ error: "Error al crear pedido" });
  }
});

portalRouter.get("/orders/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const orderId = parseInt(req.params["id"] ?? "0");
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.clerkUserId, clerkUserId)));
    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
    const [rating] = await db.select().from(ratingsTable).where(eq(ratingsTable.orderId, orderId));
    res.json({ ...order, items, rating: rating ?? null });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pedido" });
  }
});

portalRouter.patch("/orders/:id/payment", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const orderId = parseInt(req.params["id"] ?? "0");
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.clerkUserId, clerkUserId)));
    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    const { paymentMethod, paymentProofUrl } = req.body;
    const [updated] = await db
      .update(ordersTable)
      .set({
        paymentMethod: paymentMethod ?? order.paymentMethod,
        paymentStatus: paymentProofUrl ? "PROOF_SUBMITTED" : order.paymentStatus,
        paymentProofUrl: paymentProofUrl ?? order.paymentProofUrl,
      })
      .where(eq(ordersTable.id, orderId))
      .returning();
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
    const [rating] = await db.select().from(ratingsTable).where(eq(ratingsTable.orderId, orderId));
    res.json({ ...updated, items, rating: rating ?? null });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar pago" });
  }
});

portalRouter.post("/orders/:id/rating", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const orderId = parseInt(req.params["id"] ?? "0");
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.clerkUserId, clerkUserId)));
    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    const { productRating, deliveryRating, serviceRating, comment } = req.body;
    const customer = order.customerId
      ? await db.select().from(customersTable).where(eq(customersTable.id, order.customerId)).then((r) => r[0])
      : null;
    const [rating] = await db
      .insert(ratingsTable)
      .values({
        orderId,
        customerId: customer?.id ?? null,
        clerkUserId,
        productRating,
        deliveryRating,
        serviceRating,
        comment: comment ?? null,
      })
      .onConflictDoUpdate({
        target: ratingsTable.orderId,
        set: { productRating, deliveryRating, serviceRating, comment: comment ?? null },
      })
      .returning();
    res.status(201).json(rating);
  } catch (err) {
    res.status(500).json({ error: "Error al guardar calificación" });
  }
});

portalRouter.get("/addresses", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const addresses = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.clerkUserId, clerkUserId))
      .orderBy(desc(addressesTable.isDefault));
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener direcciones" });
  }
});

portalRouter.post("/addresses", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkUserId, clerkUserId));
    if (!customer) {
      res.status(400).json({ error: "Completa tu perfil primero" });
      return;
    }
    const { label, address, district, reference, instructions, isDefault } = req.body;
    if (isDefault) {
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.clerkUserId, clerkUserId));
    }
    const [created] = await db
      .insert(addressesTable)
      .values({
        customerId: customer.id,
        clerkUserId,
        label: label ?? "Casa",
        address,
        district: district ?? null,
        reference: reference ?? null,
        instructions: instructions ?? null,
        isDefault: isDefault ?? false,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error al guardar dirección" });
  }
});

portalRouter.patch("/addresses/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const addrId = parseInt(req.params["id"] ?? "0");
    const [existing] = await db
      .select()
      .from(addressesTable)
      .where(and(eq(addressesTable.id, addrId), eq(addressesTable.clerkUserId, clerkUserId)));
    if (!existing) {
      res.status(404).json({ error: "Dirección no encontrada" });
      return;
    }
    const { label, address, district, reference, instructions, isDefault } = req.body;
    if (isDefault) {
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.clerkUserId, clerkUserId));
    }
    const [updated] = await db
      .update(addressesTable)
      .set({
        label: label ?? existing.label,
        address: address ?? existing.address,
        district: district ?? existing.district,
        reference: reference ?? existing.reference,
        instructions: instructions ?? existing.instructions,
        isDefault: isDefault ?? existing.isDefault,
      })
      .where(eq(addressesTable.id, addrId))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar dirección" });
  }
});

portalRouter.delete("/addresses/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const addrId = parseInt(req.params["id"] ?? "0");
    const [existing] = await db
      .select()
      .from(addressesTable)
      .where(and(eq(addressesTable.id, addrId), eq(addressesTable.clerkUserId, clerkUserId)));
    if (!existing) {
      res.status(404).json({ error: "Dirección no encontrada" });
      return;
    }
    await db.delete(addressesTable).where(eq(addressesTable.id, addrId));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar dirección" });
  }
});

export default portalRouter;
