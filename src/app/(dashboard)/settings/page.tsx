import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { FormField, SubmitButton } from "@/components/FormField";
import { updateStoreSettings } from "./actions";

export default async function StoreSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requirePageRole("OWNER_ADMIN");
  const { saved } = await searchParams;
  const branch = await db.branch.findUniqueOrThrow({ where: { id: user.branchId } });

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Store Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        This information appears on the storefront, printed receipts, and GCash payment instructions at
        checkout.
      </p>

      {saved && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          Settings saved.
        </div>
      )}

      <form action={updateStoreSettings} className="space-y-4">
        <FormField label="Store Name" name="name" required defaultValue={branch.name} />
        <FormField label="Address" name="address" defaultValue={branch.address ?? ""} />
        <FormField
          label="Contact Number"
          name="phone"
          defaultValue={branch.phone ?? ""}
          placeholder="e.g. 0917-000-1234"
        />
        <FormField
          label="GCash Number"
          name="gcashNumber"
          defaultValue={branch.gcashNumber ?? ""}
          placeholder="Where online customers send GCash payments"
        />
        <p className="text-xs text-gray-400">
          If the GCash number is left blank, the contact number is shown in checkout payment instructions
          instead.
        </p>
        <SubmitButton>Save Settings</SubmitButton>
      </form>
    </div>
  );
}
