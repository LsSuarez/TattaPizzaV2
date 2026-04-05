import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, customersTable } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  ListOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderId));
  return { ...order, items };
}

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  let baseQuery = db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  if (query.success && query.data.status) {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.status, query.data.status))
      .orderBy(desc(ordersTable.createdAt))
      .limit(query.data.limit ?? 100);
    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, o.id));
        return { ...o, items };
      })
    );
    res.json(ordersWithItems);
    return;
  }
  const limit = query.success ? (query.data.limit ?? 100) : 100;
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);
  const ordersWithItems = await Promise.all(
    orders.map(async (o) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, o.id));
      return { ...o, items };
    })
  );
  res.json(ordersWithItems);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
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
  } else {
    const [newCustomer] = await db
      .insert(customersTable)
      .values({ name: orderData.customerName, phone: orderData.customerPhone })
      .returning();
    customerId = newCustomer.id;
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const [order] = await db
    .insert(ordersTable)
    .values({ ...orderData, customerId, total })
    .returning();

  const orderItemsData = items.map((item) => ({
    orderId: order.id,
    menuItemId: item.menuItemId ?? null,
    name: item.name,
    size: item.size ?? null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.unitPrice * item.quantity,
  }));
  const insertedItems = await db.insert(orderItemsTable).values(orderItemsData).returning();

  res.status(201).json({ ...order, items: insertedItems });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(ordersTable)
    .set(parsed.data)
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const order = await getOrderWithItems(updated.id);
  res.json(order);
});

export default router;
