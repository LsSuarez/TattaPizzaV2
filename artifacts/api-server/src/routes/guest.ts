import { Router } from "express";
import { db } from "@workspace/db";
import {
  customersTable,
  ordersTable,
  orderItemsTable,
  menuItemsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const guestRouter = Router();

/**
 * POST /api/guest/orders
 * Creates an order without requiring authentication.
 * Used by the chatbot widget for walk-in / phone customers.
 */
guestRouter.post("/guest/orders", async (req, res) => {
  try {
    const {
      name,
      phone,
      deliveryType,
      deliveryAddress,
      paymentMethod,
      notes,
      items, // [{ menuItemId, size, quantity }]
    } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: "Nombre y teléfono son obligatorios" });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Debes incluir al menos un producto" });
      return;
    }
    if (!deliveryType || !["DELIVERY", "RECOJO"].includes(deliveryType)) {
      res.status(400).json({ error: "Tipo de entrega inválido" });
      return;
    }
    if (deliveryType === "DELIVERY" && !deliveryAddress) {
      res.status(400).json({ error: "Dirección requerida para delivery" });
      return;
    }
    const validPayments = ["YAPE_PLIN", "BANK_TRANSFER", "CASH_ON_DELIVERY", "IZIPAY_CARD"];
    if (!paymentMethod || !validPayments.includes(paymentMethod)) {
      res.status(400).json({ error: "Método de pago inválido" });
      return;
    }

    // Find or create customer by phone
    let customer = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.phone, phone))
      .then((rows) => rows[0] ?? null);

    if (!customer) {
      const [created] = await db
        .insert(customersTable)
        .values({ name, phone, email: null, address: deliveryAddress ?? null })
        .returning();
      customer = created;
    }

    // Resolve menu items and compute totals
    let total = 0;
    const resolvedItems: { menuItemId: number; name: string; size: string | null; quantity: number; unitPrice: number; subtotal: number }[] = [];

    for (const item of items) {
      const [menuItem] = await db
        .select()
        .from(menuItemsTable)
        .where(eq(menuItemsTable.id, item.menuItemId));

      if (!menuItem) {
        res.status(400).json({ error: `Producto ${item.menuItemId} no encontrado` });
        return;
      }

      let unitPrice = 0;
      const size: string | null = item.size ?? null;

      if (size === "small" || size === "personal") unitPrice = menuItem.priceSmall ?? menuItem.priceMedium ?? menuItem.priceLarge ?? 0;
      else if (size === "medium" || size === "mediana") unitPrice = menuItem.priceMedium ?? menuItem.priceLarge ?? menuItem.priceSmall ?? 0;
      else if (size === "large" || size === "familiar") unitPrice = menuItem.priceLarge ?? menuItem.priceMedium ?? menuItem.priceSmall ?? 0;
      else unitPrice = menuItem.priceSmall ?? menuItem.priceMedium ?? menuItem.priceLarge ?? 0;

      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      resolvedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        size: size,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    // Create order
    const [order] = await db
      .insert(ordersTable)
      .values({
        customerId: customer.id,
        customerName: name,
        customerPhone: phone,
        status: "RECIBIDO",
        deliveryType,
        deliveryAddress: deliveryType === "DELIVERY" ? deliveryAddress : null,
        paymentMethod,
        paymentStatus: paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "PENDING",
        total,
        notes: notes ?? null,
      })
      .returning();

    // Insert order items
    await db.insert(orderItemsTable).values(
      resolvedItems.map((i) => ({
        orderId: order.id,
        menuItemId: i.menuItemId,
        name: i.name,
        size: i.size,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      }))
    );

    res.status(201).json({
      orderId: order.id,
      total,
      status: "RECIBIDO",
      message: "Pedido recibido correctamente",
    });
  } catch (err) {
    console.error("Guest order error:", err);
    res.status(500).json({ error: "Error al crear el pedido" });
  }
});

export default guestRouter;
