import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { computeAvailableStock } from "@/lib/stock";
import POSClient from "./POSClient";

export default async function POSPage() {
  const user = await requirePageRole("OWNER_ADMIN", "CASHIER_STAFF");

  const products = await db.product.findMany({
    where: { branchId: user.branchId, isActive: true, isAvailable: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { category: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      category: { select: { name: true } },
      recipe: { select: { quantity: true, ingredient: { select: { stockQty: true } } } },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">POS</h1>
      <POSClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          category: p.category.name,
          stock: computeAvailableStock(p.recipe),
        }))}
      />
    </div>
  );
}
