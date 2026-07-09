"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

export async function createCategory(formData: FormData) {
  const user = await requirePermission("products");
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  if (!name) throw new Error("Name is required");

  const category = await db.category.create({
    data: { branchId: user.branchId, name, sortOrder },
  });

  await logAudit({
    userId: user.id,
    action: "CATEGORY_CREATE",
    entityType: "Category",
    entityId: category.id,
    after: { name: category.name },
  });

  revalidatePath("/products/categories");
  revalidatePath("/products");
  redirect("/products/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const user = await requirePermission("products");
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  if (!name) throw new Error("Name is required");

  const before = await db.category.findUniqueOrThrow({ where: { id } });

  await db.category.update({ where: { id }, data: { name, sortOrder } });

  await logAudit({
    userId: user.id,
    action: "CATEGORY_UPDATE",
    entityType: "Category",
    entityId: id,
    before: { name: before.name },
    after: { name },
  });

  revalidatePath("/products/categories");
  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/shop");
  redirect("/products/categories");
}

export async function deleteCategory(id: string) {
  const user = await requirePermission("products");

  const productCount = await db.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error(`Cannot delete: ${productCount} product(s) still use this category`);
  }

  const category = await db.category.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "CATEGORY_DELETE",
    entityType: "Category",
    entityId: id,
    before: { name: category.name },
  });

  revalidatePath("/products/categories");
  revalidatePath("/products");
}
