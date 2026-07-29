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

  const paperWidthRaw = Number(formData.get("receiptPaperWidthMm"));
  if (!Number.isInteger(paperWidthRaw) || paperWidthRaw < 20 || paperWidthRaw > 120) {
    throw new Error("Paper width must be a whole number between 20 and 120mm");
  }
  const receiptPaperWidthMm = paperWidthRaw;

  const before = await db.branch.findUniqueOrThrow({ where: { id: admin.branchId } });

  await db.branch.update({
    where: { id: admin.branchId },
    data: { name, address, phone, gcashNumber, receiptPaperWidthMm },
  });

  await logAudit({
    userId: admin.id,
    action: "STORE_SETTINGS_UPDATE",
    entityType: "Branch",
    entityId: admin.branchId,
    before: {
      name: before.name,
      address: before.address,
      phone: before.phone,
      gcashNumber: before.gcashNumber,
      receiptPaperWidthMm: before.receiptPaperWidthMm,
    },
    after: { name, address, phone, gcashNumber, receiptPaperWidthMm },
  });

  // Store identity appears on the statically prerendered storefront pages.
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/checkout");
  revalidatePath("/settings");
  revalidatePath("/pos");
  revalidatePath("/orders");

  redirect("/settings?saved=1");
}
