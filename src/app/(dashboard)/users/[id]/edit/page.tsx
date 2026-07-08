import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/access";
import { FormField, FormSelect, SubmitButton } from "@/components/FormField";
import { updateUser } from "../../actions";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("OWNER_ADMIN");
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  const updateWithId = updateUser.bind(null, user.id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Edit User</h1>
      <form action={updateWithId} className="space-y-4">
        <FormField label="Name" name="name" required defaultValue={user.name} />
        <p className="text-sm text-gray-500">Email: {user.email} (not editable)</p>
        <FormField label="New Password (leave blank to keep current)" name="password" type="password" />
        <FormSelect
          label="Role"
          name="role"
          required
          defaultValue={user.role}
          options={[
            { value: "OWNER_ADMIN", label: "Owner/Admin" },
            { value: "CASHIER_STAFF", label: "Cashier/Staff" },
            { value: "KITCHEN", label: "Kitchen" },
          ]}
        />
        <SubmitButton />
      </form>
    </div>
  );
}
