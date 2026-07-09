"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDefaultBranch } from "@/lib/branch";
import { createOrder, type CartItemInput } from "@/lib/orders";

export async function submitCheckout(formData: FormData) {
  const branch = await getDefaultBranch();

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const isPickup = formData.get("fulfillment") === "pickup";
  const notes = String(formData.get("notes") || "").trim() || null;
  const itemsRaw = String(formData.get("items") || "[]");

  if (!name || !phone) throw new Error("Name and phone are required");
  if (!isPickup && !address) throw new Error("Delivery address is required");

  const items: CartItemInput[] = JSON.parse(itemsRaw);
  if (items.length === 0) throw new Error("Cart is empty");

  const idempotencyKey = String(formData.get("idempotencyKey") || "").trim() || null;

  let customer = await db.customer.findFirst({ where: { branchId: branch.id, phone } });
  if (!customer) {
    customer = await db.customer.create({
      data: { branchId: branch.id, name, phone, address: isPickup ? null : address },
    });
  }

  const order = await createOrder({
    branchId: branch.id,
    channel: "ONLINE",
    items,
    customerId: customer.id,
    paymentMethod: "UNPAID",
    amountPaid: 0,
    notes,
    isPickup,
    complete: false,
    idempotencyKey,
  });

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  revalidatePath("/inventory");
  revalidatePath("/customers");

  redirect(`/shop/thank-you/${order.id}`);
}
