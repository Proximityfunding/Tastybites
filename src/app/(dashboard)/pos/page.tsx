import { requirePagePermission } from "@/lib/access";
import { db } from "@/lib/db";
import { computeAvailableStock } from "@/lib/stock";
import { getDefaultBranch } from "@/lib/branch";
import POSClient from "./POSClient";

export default async function POSPage() {
  const user = await requirePagePermission("pos");

  const [products, branch] = await Promise.all([
    db.product.findMany({
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
    }),
    getDefaultBranch(),
  ]);

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
        branch={branch}
      />
    </div>
  );
}
