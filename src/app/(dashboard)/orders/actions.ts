"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireRole } from "@/lib/access";
import { updateOrderStatus, voidOrder } from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";

export async function changeOrderStatus(orderId: string, status: OrderStatus) {
  const user = await requireStaff();
  await updateOrderStatus(orderId, status, user.id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/kitchen");
  revalidatePath("/inventory");
  revalidatePath("/pnl");
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
