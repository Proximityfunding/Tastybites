import { FormField, SubmitButton } from "@/components/FormField";
import { requirePagePermission } from "@/lib/access";
import { createCustomer } from "../actions";

export default async function NewCustomerPage() {
  await requirePagePermission("customers");
  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Add Customer</h1>
      <form action={createCustomer} className="space-y-4">
        <FormField label="Name" name="name" required />
        <FormField label="Phone" name="phone" />
        <FormField label="Address" name="address" />
        <FormField label="Facebook Handle" name="fbHandle" />
        <FormField label="Tags (comma-separated)" name="tags" placeholder="regular, delivery-only, VIP" />
        <SubmitButton />
      </form>
    </div>
  );
}
