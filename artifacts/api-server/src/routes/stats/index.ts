import { Router, type IRouter } from "express";
import { eq, gte, and, sql, count } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, customersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrdersToday] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, today));

  const [pendingOrders] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "RECIBIDO"));

  const [inPreparationOrders] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "EN_PREPARACION"));

  const [readyOrders] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "LISTO"));

  const [deliveredTodayRow] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(and(eq(ordersTable.status, "ENTREGADO"), gte(ordersTable.createdAt, today)));

  const [revenueTodayRow] = await db
    .select({ total: sql<number>`coalesce(sum(total), 0)` })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, today));

  const [totalCustomers] = await db.select({ count: count() }).from(customersTable);

  const topItems = await db
    .select({
      name: orderItemsTable.name,
      count: sql<number>`cast(sum(${orderItemsTable.quantity}) as int)`,
    })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.name)
    .orderBy(sql`sum(${orderItemsTable.quantity}) desc`)
    .limit(5);

  res.json({
    totalOrdersToday: totalOrdersToday?.count ?? 0,
    pendingOrders: pendingOrders?.count ?? 0,
    inPreparationOrders: inPreparationOrders?.count ?? 0,
    readyOrders: readyOrders?.count ?? 0,
    deliveredOrdersToday: deliveredTodayRow?.count ?? 0,
    totalRevenueToday: Number(revenueTodayRow?.total ?? 0),
    totalCustomers: totalCustomers?.count ?? 0,
    topItems: topItems.map((t) => ({ name: t.name, count: Number(t.count) })),
  });
});

export default router;
