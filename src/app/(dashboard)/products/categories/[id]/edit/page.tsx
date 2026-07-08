import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { FormField, SubmitButton } from "@/components/FormField";
import { updateCategory } from "../../actions";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("OWNER_ADMIN");
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) notFound();

  const updateWithId = updateCategory.bind(null, category.id);

  return (
    <div className="max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Edit Category</h1>
      <form action={updateWithId} className="space-y-4">
        <FormField label="Name" name="name" required defaultValue={category.name} />
        <FormField label="Sort Order" name="sortOrder" type="number" defaultValue={category.sortOrder} />
        <SubmitButton />
      </form>
    </div>
  );
}
