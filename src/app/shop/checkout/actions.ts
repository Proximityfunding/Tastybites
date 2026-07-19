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
  const email = String(formData.get("email") || "").trim().toLowerCase() || null;
  const address = String(formData.get("address") || "").trim();
  const isPickup = formData.get("fulfillment") === "pickup";
  const notes = String(formData.get("notes") || "").trim() || null;
  const itemsRaw = String(formData.get("items") || "[]");

  if (!name || !phone) throw new Error("Name and phone are required");
  if (!isPickup && !address) throw new Error("Delivery address is required");

  const items: CartItemInput[] = JSON.parse(itemsRaw);
  if (items.length === 0) throw new Error("Cart is empty");

  const idempotencyKey = String(formData.get("idempotencyKey") || "").trim() || null;

  // COD pays on pickup/delivery; GCash must supply the e-wallet transaction reference
  // as proof of payment — without it the order is rejected outright.
  const paymentType = formData.get("paymentType") === "gcash" ? "gcash" : "cod";
  const gcashReference = String(formData.get("gcashReference") || "").trim();
  if (paymentType === "gcash" && gcashReference.length < 4) {
    throw new Error("Your GCash payment reference number is required to place this order");
  }

  let customer = await db.customer.findFirst({ where: { branchId: branch.id, phone } });
  if (!customer) {
    customer = await db.customer.create({
      data: { branchId: branch.id, name, phone, email, address: isPickup ? null : address },
    });
  } else if (email && customer.email !== email) {
    customer = await db.customer.update({ where: { id: customer.id }, data: { email } });
  }

  // total is computed server-side inside createOrder; for GCash the customer paid the
  // exact total up front, so amountPaid mirrors it once the order's total is known.
  const order = await createOrder({
    branchId: branch.id,
    channel: "ONLINE",
    items,
    customerId: customer.id,
    paymentMethod: paymentType === "gcash" ? "GCASH" : "UNPAID",
    amountPaid: 0,
    notes,
    isPickup,
    complete: false,
    idempotencyKey,
    paymentReference: paymentType === "gcash" ? gcashReference : null,
  });

  if (paymentType === "gcash" && order.amountPaid !== order.total) {
    await db.order.update({ where: { id: order.id }, data: { amountPaid: order.total } });
  }

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  revalidatePath("/inventory");
  revalidatePath("/customers");

  redirect(`/shop/thank-you/${order.id}`);
}
