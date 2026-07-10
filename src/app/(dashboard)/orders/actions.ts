"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff, requireRole, hasPermission, AccessError } from "@/lib/access";
import { updateOrderStatus, voidOrder } from "@/lib/orders";
import { logAudit } from "@/lib/audit";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

/** Reachable from both /orders (needs "orders") and the Kitchen Display board (needs "kitchen"). */
export async function changeOrderStatus(orderId: string, status: OrderStatus) {
  const user = await requireStaff();
  if (!(await hasPermission(user.role, "orders")) && !(await hasPermission(user.role, "kitchen"))) {
    throw new AccessError("Requires permission: orders or kitchen");
  }
  await updateOrderStatus(orderId, status, user.id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/kitchen");
  revalidatePath("/inventory");
  revalidatePath("/pnl");
  revalidatePath("/reports");
}

/** Records how a completed-but-unpaid order was actually paid (e.g. online orders paid on pickup/delivery). */
export async function recordOrderPayment(
  orderId: string,
  method: Exclude<PaymentMethod, "UNPAID">,
  amountTendered: number
) {
  const user = await requireStaff();
  if (!(await hasPermission(user.role, "orders")) && !(await hasPermission(user.role, "pos"))) {
    throw new AccessError("Requires permission: orders or pos");
  }
  if (!["CASH", "GCASH", "CARD"].includes(method)) throw new Error("Invalid payment method");

  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "COMPLETED") throw new Error("Payment can only be recorded for completed orders");
  if (order.paymentMethod !== "UNPAID") throw new Error("This order is already paid");

  const amountPaid = method === "CASH" ? Math.round(amountTendered) : order.total;
  if (method === "CASH" && amountPaid < order.total) {
    throw new Error("Amount received is less than the total");
  }

  await db.order.update({ where: { id: orderId }, data: { paymentMethod: method, amountPaid } });

  await logAudit({
    userId: user.id,
    action: "ORDER_PAYMENT_RECORDED",
    entityType: "Order",
    entityId: orderId,
    orderId,
    before: { paymentMethod: order.paymentMethod },
    after: { paymentMethod: method, amountPaid },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/reports");
}

export async function voidOrderAction(orderId: string, formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) throw new Error("A reason is required to void an order");

  await voidOrder(orderId, reason, user.id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/inventory");
  revalidatePath("/pnl");
  revalidatePath("/reports");
}
