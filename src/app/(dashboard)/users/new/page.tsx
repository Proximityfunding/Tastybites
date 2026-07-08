import { FormField, FormSelect, SubmitButton } from "@/components/FormField";
import { requirePageRole } from "@/lib/access";
import { createUser } from "../actions";

export default async function NewUserPage() {
  await requirePageRole("OWNER_ADMIN");
  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Add User</h1>
      <form action={createUser} className="space-y-4">
        <FormField label="Name" name="name" required />
        <FormField label="Email" name="email" type="email" required />
        <FormField label="Password (min 8 characters)" name="password" type="password" required />
        <FormSelect
          label="Role"
          name="role"
          required
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
