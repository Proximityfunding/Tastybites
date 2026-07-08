import Link from "next/link";
import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { FormField, SubmitButton } from "@/components/FormField";
import { createCategory, deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const user = await requirePageRole("OWNER_ADMIN");

  const categories = await db.category.findMany({
    where: { branchId: user.branchId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/products" className="text-sm text-orange-600 hover:underline">
            ← Back to Products
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Categories</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Sort Order</th>
                <th className="py-2 pr-4">Products</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{c.sortOrder}</td>
                  <td className="py-2 pr-4 text-gray-600">{c._count.products}</td>
                  <td className="py-2 pr-4 space-x-3">
                    <Link href={`/products/categories/${c.id}/edit`} className="text-orange-600 hover:underline">
                      Edit
                    </Link>
                    {c._count.products === 0 && (
                      <form action={deleteCategory.bind(null, c.id)} className="inline">
                        <button type="submit" className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="max-w-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Add Category</h2>
          <form action={createCategory} className="space-y-4">
            <FormField label="Name" name="name" required placeholder="e.g. Burgers, Milk Tea" />
            <FormField label="Sort Order" name="sortOrder" type="number" defaultValue={0} />
            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}
