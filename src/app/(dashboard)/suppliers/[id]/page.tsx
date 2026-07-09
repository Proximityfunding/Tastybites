import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/access";
import { FormField, SubmitButton } from "@/components/FormField";
import { updateSupplier } from "../actions";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("suppliers");
  const { id } = await params;
  const supplier = await db.supplier.findUnique({
    where: { id },
    include: { ingredients: { orderBy: { name: "asc" } } },
  });
  if (!supplier) notFound();

  const updateWithId = updateSupplier.bind(null, supplier.id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Edit Supplier</h1>
      <form action={updateWithId} className="space-y-4">
        <FormField label="Name" name="name" required defaultValue={supplier.name} />
        <FormField label="Contact Name" name="contactName" defaultValue={supplier.contactName ?? ""} />
        <FormField label="Phone" name="phone" defaultValue={supplier.phone ?? ""} />
        <FormField label="Email" name="email" type="email" defaultValue={supplier.email ?? ""} />
        <FormField label="Address" name="address" defaultValue={supplier.address ?? ""} />
        <SubmitButton />
      </form>

      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Ingredients Supplied</h2>
        {supplier.ingredients.length === 0 ? (
          <p className="text-sm text-gray-400">None linked yet.</p>
        ) : (
          <ul className="list-inside list-disc text-sm text-gray-700">
            {supplier.ingredients.map((i) => (
              <li key={i.id}>
                {i.name} ({i.unit})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
