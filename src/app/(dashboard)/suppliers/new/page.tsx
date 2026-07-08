import { FormField, SubmitButton } from "@/components/FormField";
import { requirePageRole } from "@/lib/access";
import { createSupplier } from "../actions";

export default async function NewSupplierPage() {
  await requirePageRole("OWNER_ADMIN");
  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Add Supplier</h1>
      <form action={createSupplier} className="space-y-4">
        <FormField label="Name" name="name" required />
        <FormField label="Contact Name" name="contactName" />
        <FormField label="Phone" name="phone" />
        <FormField label="Email" name="email" type="email" />
        <FormField label="Address" name="address" />
        <SubmitButton />
      </form>
    </div>
  );
}
