import { FormField, FormSelect, SubmitButton } from "@/components/FormField";
import { requirePageRole } from "@/lib/access";
import { createExpense } from "../actions";

const CATEGORY_OPTIONS = [
  { value: "SUPPLIES", label: "Supplies" },
  { value: "RENT", label: "Rent" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SALARIES", label: "Salaries" },
  { value: "DELIVERY_FEES", label: "Delivery Fees" },
  { value: "MISC", label: "Misc" },
];

export default async function NewExpensePage() {
  await requirePageRole("OWNER_ADMIN");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Record Expense</h1>
      <form action={createExpense} className="space-y-4">
        <FormSelect label="Category" name="category" required options={CATEGORY_OPTIONS} />
        <FormField label="Amount (₱)" name="amount" type="number" step="0.01" required />
        <FormField label="Date" name="date" type="date" required defaultValue={today} />
        <FormField label="Vendor" name="vendor" />
        <div>
          <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
            Receipt Photo
          </label>
          <input id="receipt" name="receipt" type="file" accept="image/*" className="mt-1 text-sm" />
        </div>
        <FormField label="Notes" name="notes" />
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isRecurring" />
            Recurring expense
          </label>
          <div className="mt-2">
            <FormSelect
              label="Recurrence Interval"
              name="recurrenceInterval"
              defaultValue="monthly"
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
            />
          </div>
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
