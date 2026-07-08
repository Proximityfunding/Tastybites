"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/access";
import { pesosToCentavos } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { saveUploadedFile } from "@/lib/upload";
import { logAudit } from "@/lib/audit";

function parseRecipe(formData: FormData) {
  const ingredientIds = formData.getAll("ingredientId").map(String);
  const quantities = formData.getAll("quantity").map(Number);
  const rows: { ingredientId: string; quantity: number }[] = [];
  for (let i = 0; i < ingredientIds.length; i++) {
    if (ingredientIds[i] && quantities[i] > 0) {
      rows.push({ ingredientId: ingredientIds[i], quantity: quantities[i] });
    }
  }
  return rows;
}

export async function createProduct(formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const cost = Number(formData.get("cost") || 0);
  const price = Number(formData.get("price") || 0);
  if (!name || !categoryId || !price) throw new Error("Name, category, and SRP are required");

  const imageFile = formData.get("image") as File | null;
  const imageUrl = await saveUploadedFile(imageFile, "products");
  const recipe = parseRecipe(formData);

  const product = await db.product.create({
    data: {
      branchId: user.branchId,
      name,
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      categoryId,
      description: String(formData.get("description") || "").trim() || null,
      cost: pesosToCentavos(cost),
      price: pesosToCentavos(price),
      imageUrl,
      recipe: {
        create: recipe.map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity })),
      },
    },
    include: { category: true },
  });

  await logAudit({
    userId: user.id,
    action: "PRODUCT_CREATE",
    entityType: "Product",
    entityId: product.id,
    after: { name: product.name, category: product.category.name, price: product.price, cost: product.cost },
  });

  revalidatePath("/products");
  redirect(`/products/${product.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const cost = Number(formData.get("cost") || 0);
  const price = Number(formData.get("price") || 0);
  if (!name || !categoryId || !price) throw new Error("Name, category, and SRP are required");

  const before = await db.product.findUniqueOrThrow({ where: { id }, include: { category: true } });

  const imageFile = formData.get("image") as File | null;
  const imageUrl = await saveUploadedFile(imageFile, "products");
  const recipe = parseRecipe(formData);

  await db.$transaction([
    db.product.update({
      where: { id },
      data: {
        name,
        categoryId,
        description: String(formData.get("description") || "").trim() || null,
        cost: pesosToCentavos(cost),
        price: pesosToCentavos(price),
        isActive: formData.get("isActive") === "on",
        isAvailable: formData.get("isAvailable") === "on",
        ...(imageUrl ? { imageUrl } : {}),
      },
    }),
    db.productIngredient.deleteMany({ where: { productId: id } }),
    ...(recipe.length > 0
      ? [
          db.productIngredient.createMany({
            data: recipe.map((r) => ({ productId: id, ingredientId: r.ingredientId, quantity: r.quantity })),
          }),
        ]
      : []),
  ]);

  await logAudit({
    userId: user.id,
    action: "PRODUCT_UPDATE",
    entityType: "Product",
    entityId: id,
    before: { name: before.name, category: before.category.name, price: before.price, cost: before.cost },
    after: { name, price: pesosToCentavos(price), cost: pesosToCentavos(cost) },
  });

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(id: string) {
  const user = await requireRole("OWNER_ADMIN");
  const product = await db.product.update({ where: { id }, data: { isActive: false, isAvailable: false } });

  await logAudit({
    userId: user.id,
    action: "PRODUCT_DEACTIVATE",
    entityType: "Product",
    entityId: id,
    after: { name: product.name },
  });

  revalidatePath("/products");
}
