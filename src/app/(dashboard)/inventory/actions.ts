"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/access";
import { pesosToCentavos } from "@/lib/money";
import { logAudit } from "@/lib/audit";
import { StockLogType } from "@prisma/client";

export async function createIngredient(formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  if (!name || !unit) throw new Error("Name and unit are required");

  const supplierId = String(formData.get("supplierId") || "") || null;

  const ingredient = await db.ingredient.create({
    data: {
      branchId: user.branchId,
      name,
      unit,
      stockQty: Number(formData.get("stockQty") || 0),
      reorderLevel: Number(formData.get("reorderLevel") || 0),
      costPerUnit: pesosToCentavos(Number(formData.get("costPerUnit") || 0)),
      supplierId,
    },
  });

  await logAudit({
    userId: user.id,
    action: "INGREDIENT_CREATE",
    entityType: "Ingredient",
    entityId: ingredient.id,
    after: { name: ingredient.name, unit: ingredient.unit, stockQty: ingredient.stockQty },
  });

  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function updateIngredient(id: string, formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  if (!name || !unit) throw new Error("Name and unit are required");

  const before = await db.ingredient.findUniqueOrThrow({ where: { id } });
  const supplierId = String(formData.get("supplierId") || "") || null;
  const reorderLevel = Number(formData.get("reorderLevel") || 0);
  const costPerUnit = pesosToCentavos(Number(formData.get("costPerUnit") || 0));

  await db.ingredient.update({
    where: { id },
    data: { name, unit, reorderLevel, costPerUnit, supplierId },
  });

  await logAudit({
    userId: user.id,
    action: "INGREDIENT_UPDATE",
    entityType: "Ingredient",
    entityId: id,
    before: { name: before.name, reorderLevel: before.reorderLevel, costPerUnit: before.costPerUnit },
    after: { name, reorderLevel, costPerUnit },
  });

  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function recordStockMovement(formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const ingredientId = String(formData.get("ingredientId") || "");
  const type = String(formData.get("type") || "") as StockLogType;
  const quantity = Number(formData.get("quantity") || 0);
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!ingredientId || !quantity) throw new Error("Ingredient and quantity are required");

  const delta = type === "STOCK_OUT_WASTE" ? -Math.abs(quantity) : quantity;

  await db.$transaction([
    db.ingredient.update({
      where: { id: ingredientId },
      data: { stockQty: { increment: delta } },
    }),
    db.stockLog.create({
      data: {
        branchId: user.branchId,
        ingredientId,
        type,
        quantity: Math.abs(quantity),
        reason,
        userId: user.id,
      },
    }),
  ]);

  revalidatePath("/inventory");
}
