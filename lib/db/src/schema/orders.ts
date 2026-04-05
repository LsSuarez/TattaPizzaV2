import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  clerkUserId: text("clerk_user_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryAddress: text("delivery_address"),
  deliveryType: text("delivery_type").notNull().default("delivery"),
  status: text("status").notNull().default("RECIBIDO"),
  paymentMethod: text("payment_method").default("CASH_ON_DELIVERY"),
  paymentStatus: text("payment_status").default("PENDING"),
  paymentProofUrl: text("payment_proof_url"),
  total: integer("total").notNull().default(0),
  notes: text("notes"),
  whatsappMessageId: text("whatsapp_message_id"),
  deliveryManId: integer("delivery_man_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
