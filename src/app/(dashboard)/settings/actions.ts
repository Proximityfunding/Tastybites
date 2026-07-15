"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/access";
import { logAudit } from "@/lib/audit";

/** Owner-only: store identity shows on the public storefront, receipts, and payment instructions. */
export async function updateStoreSettings(formData: FormData) {
  const admin = await requireRole("OWNER_ADMIN");

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const gcashNumber = String(formData.get("gcashNumber") || "").trim() || null;
  if (!name) throw new Error("Store name is required");

  const before = await db.branch.findUniqueOrThrow({ where: { id: admin.branchId } });

  await db.branch.update({
    where: { id: admin.branchId },
    data: { name, address, phone, gcashNumber },
  });

  await logAudit({
    userId: admin.id,
    action: "STORE_SETTINGS_UPDATE",
    entityType: "Branch",
    entityId: admin.branchId,
    before: { name: before.name, address: before.address, phone: before.phone, gcashNumber: before.gcashNumber },
    after: { name, address, phone, gcashNumber },
  });

  // Store identity appears on the statically prerendered storefront pages.
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/checkout");
  revalidatePath("/settings");

  redirect("/settings?saved=1");
}
