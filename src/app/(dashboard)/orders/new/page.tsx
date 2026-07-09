import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { computeAvailableStock } from "@/lib/stock";
import { getDefaultBranch } from "@/lib/branch";
import POSClient from "../../pos/POSClient";

export default async function QuickOrderEntryPage() {
  const user = await requirePageRole("OWNER_ADMIN", "CASHIER_STAFF");
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
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Quick Order Entry</h1>
      <p className="mb-4 text-sm text-gray-500">For keying in Facebook Messenger orders manually.</p>
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
        defaultChannel="ONLINE"
      />
    </div>
  );
}
