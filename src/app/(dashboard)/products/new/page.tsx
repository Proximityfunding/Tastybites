import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/access";
import { FormField, FormSelect, FormTextArea, SubmitButton } from "@/components/FormField";
import RecipeInput from "../RecipeInput";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const user = await requirePageRole("OWNER_ADMIN");
  const [ingredients, categories] = await Promise.all([
    db.ingredient.findMany({ where: { branchId: user.branchId }, orderBy: { name: "asc" } }),
    db.category.findMany({ where: { branchId: user.branchId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Add Product</h1>
      <form action={createProduct} className="space-y-4">
        <FormField label="Name" name="name" required />
        {categories.length > 0 ? (
          <FormSelect
            label="Category"
            name="categoryId"
            required
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        ) : (
          <p className="text-sm text-gray-500">
            No categories yet.{" "}
            <Link href="/products/categories" className="text-orange-600 hover:underline">
              Add one first
            </Link>
            .
          </p>
        )}
        <FormTextArea label="Description" name="description" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cost (₱)" name="cost" type="number" step="0.01" defaultValue={0} />
          <FormField label="SRP (₱)" name="price" type="number" step="0.01" required />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Photo
          </label>
          <input id="image" name="image" type="file" accept="image/*" className="mt-1 text-sm" />
        </div>
        <RecipeInput ingredients={ingredients} />
        <SubmitButton />
      </form>
    </div>
  );
}
