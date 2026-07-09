"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff, hasPermission, AccessError } from "@/lib/access";
import { createOrder, type CartItemInput } from "@/lib/orders";
import type { OrderChannel, PaymentMethod } from "@prisma/client";

/** Shared by POS ("pos" permission) and Quick Order Entry ("orders" permission). */
export async function submitPOSOrder(input: {
  channel: OrderChannel;
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
  discount?: number;
  notes?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  complete: boolean;
}) {
  const user = await requireStaff();
  if (!(await hasPermission(user.role, "pos")) && !(await hasPermission(user.role, "orders"))) {
    throw new AccessError("Requires permission: pos or orders");
  }

  let customerId: string | null = null;
  const phone = input.customerPhone?.trim();
  if (phone) {
    const existing = await db.customer.findFirst({ where: { branchId: user.branchId, phone } });
    if (existing) {
      customerId = existing.id;
    } else if (input.customerName?.trim()) {
      const created = await db.customer.create({
        data: { branchId: user.branchId, name: input.customerName.trim(), phone },
      });
      customerId = created.id;
    }
  }

  const order = await createOrder({
    branchId: user.branchId,
    channel: input.channel,
    items: input.items,
    customerId,
    paymentMethod: input.paymentMethod,
    amountPaid: input.amountPaid,
    discount: input.discount,
    notes: input.notes,
    createdById: user.id,
    complete: input.complete,
  });

  revalidatePath("/orders");
  revalidatePath("/inventory");
  revalidatePath("/pos");
  revalidatePath("/customers");

  const fullOrder = await db.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: { include: { product: true } }, customer: true },
  });

  return fullOrder;
}
