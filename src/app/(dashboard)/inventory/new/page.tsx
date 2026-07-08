import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/access";
import { FormField, FormSelect, SubmitButton } from "@/components/FormField";
import { createIngredient } from "../actions";

export default async function NewIngredientPage() {
  const user = await requirePageRole("OWNER_ADMIN");
  const suppliers = await db.supplier.findMany({
    where: { branchId: user.branchId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Add Ingredient</h1>
      <form action={createIngredient} className="space-y-4">
        <FormField label="Name" name="name" required />
        <FormField label="Unit (e.g. g, ml, pcs)" name="unit" required />
        <FormField label="Starting Stock Qty" name="stockQty" type="number" step="0.01" defaultValue={0} />
        <FormField label="Reorder Level" name="reorderLevel" type="number" step="0.01" defaultValue={0} />
        <FormField label="Cost per Unit (₱)" name="costPerUnit" type="number" step="0.01" defaultValue={0} />
        <FormSelect
          label="Supplier"
          name="supplierId"
          options={[{ value: "", label: "None" }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
        />
        <SubmitButton />
      </form>
    </div>
  );
}
