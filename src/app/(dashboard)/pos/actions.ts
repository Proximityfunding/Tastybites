"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/access";
import { createOrder, type CartItemInput } from "@/lib/orders";
import type { OrderChannel, PaymentMethod } from "@prisma/client";

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
  const user = await requireRole("OWNER_ADMIN", "CASHIER_STAFF");

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
