import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../../middlewares/requireAuth";

const paymentsRouter = Router();

const IZIPAY_SHOP_ID = process.env.IZIPAY_SHOP_ID ?? "";
const IZIPAY_API_KEY = process.env.IZIPAY_API_KEY ?? "";
const IZIPAY_API_URL = process.env.IZIPAY_API_URL ?? "https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment";
const SIMULATION_MODE = !IZIPAY_SHOP_ID || !IZIPAY_API_KEY;

async function createIzipaySession(orderId: number, amountCents: number, customerEmail: string, customerName: string) {
  if (SIMULATION_MODE) {
    return { formToken: `SIM_${orderId}_${Date.now()}`, simulationMode: true };
  }

  const authHeader = "Basic " + Buffer.from(`${IZIPAY_SHOP_ID}:${IZIPAY_API_KEY}`).toString("base64");
  const body = {
    amount: amountCents,
    currency: "604",
    orderId: `TATA-${orderId}`,
    customer: {
      email: customerEmail || "cliente@tatapizza.pe",
      billingDetails: { firstName: customerName.split(" ")[0], lastName: customerName.split(" ").slice(1).join(" ") || "." },
    },
  };

  const res = await fetch(IZIPAY_API_URL, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Izipay error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { status: string; answer?: { formToken?: string }; errorMessage?: string };
  if (data.status !== "SUCCESS" || !data.answer?.formToken) {
    throw new Error(data.errorMessage ?? "No se pudo crear la sesión de pago");
  }

  return { formToken: data.answer.formToken, simulationMode: false };
}

paymentsRouter.post("/payments/create-session", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { orderId } = req.body as { orderId: number };

    if (!orderId) {
      res.status(400).json({ error: "orderId es obligatorio" });
      return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.clerkUserId, clerkUserId)));

    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }

    if (order.paymentStatus === "PAID") {
      res.status(400).json({ error: "Este pedido ya está pagado" });
      return;
    }

    const result = await createIzipaySession(order.id, order.total, order.customerEmail ?? "", order.customerName);

    res.json({
      orderId: order.id,
      amount: order.total,
      formToken: result.formToken,
      simulationMode: result.simulationMode,
      shopId: SIMULATION_MODE ? null : IZIPAY_SHOP_ID,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear sesión de pago";
    res.status(500).json({ error: message });
  }
});

paymentsRouter.post("/payments/confirm-simulation", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { orderId, success } = req.body as { orderId: number; success: boolean };

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.clerkUserId, clerkUserId)));

    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ paymentStatus: success ? "PAID" : "FAILED" })
      .where(eq(ordersTable.id, orderId))
      .returning();

    res.json({ orderId: updated.id, paymentStatus: updated.paymentStatus });
  } catch (err) {
    res.status(500).json({ error: "Error al confirmar pago" });
  }
});

paymentsRouter.post("/payments/ipn", async (req, res) => {
  try {
    const { orderStatus, orderId, paymentMethodType } = req.body as {
      orderStatus?: string;
      orderId?: string;
      paymentMethodType?: string;
    };

    if (orderId && orderId.startsWith("TATA-")) {
      const internalId = parseInt(orderId.replace("TATA-", ""), 10);
      if (!isNaN(internalId)) {
        const isPaid = orderStatus === "PAID";
        await db
          .update(ordersTable)
          .set({ paymentStatus: isPaid ? "PAID" : "FAILED" })
          .where(eq(ordersTable.id, internalId));
      }
    }

    res.json({ status: "OK" });
  } catch (err) {
    res.status(500).json({ error: "Error procesando IPN" });
  }
});

export default paymentsRouter;
