import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/access";
import { centavosToPesos, formatCentavos } from "@/lib/money";
import { FormField, FormSelect, FormTextArea, SubmitButton } from "@/components/FormField";
import RecipeInput from "../../RecipeInput";
import { updateProduct } from "../../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("products");
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { recipe: { include: { ingredient: true } }, category: true },
  });
  if (!product) notFound();

  const [ingredients, categories] = await Promise.all([
    db.ingredient.findMany({ where: { branchId: product.branchId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { branchId: product.branchId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const updateWithId = updateProduct.bind(null, product.id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Edit Product</h1>
      {product.imageUrl && (
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={160}
          height={160}
          className="mb-4 rounded-md object-cover"
        />
      )}
      <form action={updateWithId} className="space-y-4">
        <FormField label="Name" name="name" required defaultValue={product.name} />
        <FormSelect
          label="Category"
          name="categoryId"
          required
          defaultValue={product.categoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FormTextArea label="Description" name="description" defaultValue={product.description ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Cost (₱)"
            name="cost"
            type="number"
            step="0.01"
            defaultValue={centavosToPesos(product.cost)}
          />
          <FormField
            label="SRP (₱)"
            name="price"
            type="number"
            step="0.01"
            required
            defaultValue={centavosToPesos(product.price)}
          />
        </div>
        {product.price > 0 && (
          <p className="text-xs text-gray-500">
            Margin: {formatCentavos(product.price - product.cost)} (
            {Math.round(((product.price - product.cost) / product.price) * 100)}%)
          </p>
        )}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Replace Photo
          </label>
          <input id="image" name="image" type="file" accept="image/*" className="mt-1 text-sm" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isAvailable" defaultChecked={product.isAvailable} />
            Available
          </label>
        </div>
        <RecipeInput
          ingredients={ingredients}
          initialRows={product.recipe.map((r) => ({ ingredientId: r.ingredientId, quantity: String(r.quantity) }))}
        />
        <SubmitButton />
      </form>
    </div>
  );
}
