import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, customersTable } from "@workspace/db";
import { WhatsappWebhookBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/webhook/whatsapp", async (req, res): Promise<void> => {
  const parsed = WhatsappWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, ...orderData } = parsed.data;

  let customerId: number | null = null;
  const existingCustomers = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.phone, orderData.customerPhone));
  if (existingCustomers.length > 0) {
    customerId = existingCustomers[0].id;
    if (existingCustomers[0].name !== orderData.customerName) {
      await db
        .update(customersTable)
        .set({ name: orderData.customerName, address: orderData.deliveryAddress ?? null })
        .where(eq(customersTable.id, customerId));
    }
  } else {
    const [newCustomer] = await db
      .insert(customersTable)
      .values({
        name: orderData.customerName,
        phone: orderData.customerPhone,
        address: orderData.deliveryAddress ?? null,
      })
      .returning();
    customerId = newCustomer.id;
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress ?? null,
      deliveryType: orderData.deliveryType ?? "delivery",
      notes: orderData.notes ?? null,
      whatsappMessageId: orderData.whatsappMessageId ?? null,
      total,
      status: "RECIBIDO",
    })
    .returning();

  const orderItemsData = items.map((item) => ({
    orderId: order.id,
    menuItemId: null,
    name: item.name,
    size: item.size ?? null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.unitPrice * item.quantity,
  }));
  const insertedItems = await db.insert(orderItemsTable).values(orderItemsData).returning();

  req.log.info({ orderId: order.id, customer: orderData.customerName }, "WhatsApp order received via webhook");

  res.json({
    success: true,
    orderId: order.id,
    message: `Pedido #${order.id} creado para ${orderData.customerName}. Total: S/.${(total / 100).toFixed(2)}`,
    order: { ...order, items: insertedItems },
  });
});

export default router;
