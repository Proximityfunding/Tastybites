"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/access";
import { logAudit } from "@/lib/audit";

function fieldOrNull(formData: FormData, name: string) {
  const value = String(formData.get(name) || "").trim();
  return value || null;
}

export async function createSupplier(formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  const supplier = await db.supplier.create({
    data: {
      branchId: user.branchId,
      name,
      contactName: fieldOrNull(formData, "contactName"),
      phone: fieldOrNull(formData, "phone"),
      email: fieldOrNull(formData, "email"),
      address: fieldOrNull(formData, "address"),
    },
  });

  await logAudit({
    userId: user.id,
    action: "SUPPLIER_CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    after: { name: supplier.name },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(id: string, formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  const before = await db.supplier.findUniqueOrThrow({ where: { id } });

  await db.supplier.update({
    where: { id },
    data: {
      name,
      contactName: fieldOrNull(formData, "contactName"),
      phone: fieldOrNull(formData, "phone"),
      email: fieldOrNull(formData, "email"),
      address: fieldOrNull(formData, "address"),
    },
  });

  await logAudit({
    userId: user.id,
    action: "SUPPLIER_UPDATE",
    entityType: "Supplier",
    entityId: id,
    before: { name: before.name },
    after: { name },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: string) {
  const user = await requireRole("OWNER_ADMIN");
  const supplier = await db.supplier.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "SUPPLIER_DELETE",
    entityType: "Supplier",
    entityId: id,
    before: { name: supplier.name },
  });

  revalidatePath("/suppliers");
}
