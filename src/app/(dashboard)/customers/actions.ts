"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

function parseTags(formData: FormData): string[] {
  const raw = String(formData.get("tags") || "");
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createCustomer(formData: FormData) {
  const user = await requirePermission("customers");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  const customer = await db.customer.create({
    data: {
      branchId: user.branchId,
      name,
      phone: String(formData.get("phone") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      fbHandle: String(formData.get("fbHandle") || "").trim() || null,
      tags: parseTags(formData),
    },
  });

  await logAudit({
    userId: user.id,
    action: "CUSTOMER_CREATE",
    entityType: "Customer",
    entityId: customer.id,
    after: { name: customer.name, phone: customer.phone },
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  const user = await requirePermission("customers");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  const before = await db.customer.findUniqueOrThrow({ where: { id } });

  await db.customer.update({
    where: { id },
    data: {
      name,
      phone: String(formData.get("phone") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      fbHandle: String(formData.get("fbHandle") || "").trim() || null,
      tags: parseTags(formData),
    },
  });

  await logAudit({
    userId: user.id,
    action: "CUSTOMER_UPDATE",
    entityType: "Customer",
    entityId: id,
    before: { name: before.name, phone: before.phone, tags: before.tags },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}
