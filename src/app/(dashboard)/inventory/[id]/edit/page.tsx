import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/access";
import { centavosToPesos } from "@/lib/money";
import { FormField, FormSelect, SubmitButton } from "@/components/FormField";
import { updateIngredient } from "../../actions";

export default async function EditIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("OWNER_ADMIN");
  const { id } = await params;
  const ingredient = await db.ingredient.findUnique({ where: { id } });
  if (!ingredient) notFound();

  const suppliers = await db.supplier.findMany({
    where: { branchId: ingredient.branchId },
    orderBy: { name: "asc" },
  });

  const updateWithId = updateIngredient.bind(null, ingredient.id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Edit Ingredient</h1>
      <form action={updateWithId} className="space-y-4">
        <FormField label="Name" name="name" required defaultValue={ingredient.name} />
        <FormField label="Unit" name="unit" required defaultValue={ingredient.unit} />
        <FormField
          label="Reorder Level"
          name="reorderLevel"
          type="number"
          step="0.01"
          defaultValue={ingredient.reorderLevel}
        />
        <FormField
          label="Cost per Unit (₱)"
          name="costPerUnit"
          type="number"
          step="0.01"
          defaultValue={centavosToPesos(ingredient.costPerUnit)}
        />
        <FormSelect
          label="Supplier"
          name="supplierId"
          defaultValue={ingredient.supplierId ?? ""}
          options={[{ value: "", label: "None" }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
        />
        <p className="text-xs text-gray-500">
          Current stock: {ingredient.stockQty} {ingredient.unit}. Use &quot;Record Stock Movement&quot; on the
          Inventory page to change stock levels.
        </p>
        <SubmitButton />
      </form>
    </div>
  );
}
