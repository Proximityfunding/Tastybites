import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { formatCentavos } from "@/lib/money";
import { recordStockMovement } from "./actions";
import { FormSelect, FormField, SubmitButton } from "@/components/FormField";

export default async function InventoryPage() {
  const session = await auth();
  const branchId = session!.user.branchId;
  const isOwner = session!.user.role === "OWNER_ADMIN";

  const [ingredients, recentLogs] = await Promise.all([
    db.ingredient.findMany({
      where: { branchId },
      orderBy: { name: "asc" },
      include: { supplier: true },
    }),
    db.stockLog.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { ingredient: true, user: true },
    }),
  ]);

  const lowStock = ingredients.filter((i) => i.stockQty <= i.reorderLevel);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        {isOwner && (
          <Link
            href="/inventory/new"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Add Ingredient
          </Link>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Low stock: {lowStock.map((i) => i.name).join(", ")}
        </div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Ingredient</th>
            <th className="py-2 pr-4">Stock</th>
            <th className="py-2 pr-4">Reorder Level</th>
            <th className="py-2 pr-4">Cost/Unit</th>
            <th className="py-2 pr-4">Supplier</th>
            {isOwner && <th className="py-2 pr-4" />}
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => {
            const low = i.stockQty <= i.reorderLevel;
            return (
              <tr key={i.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-900">{i.name}</td>
                <td className={`py-2 pr-4 ${low ? "font-semibold text-red-600" : "text-gray-700"}`}>
                  {i.stockQty} {i.unit}
                </td>
                <td className="py-2 pr-4 text-gray-600">
                  {i.reorderLevel} {i.unit}
                </td>
                <td className="py-2 pr-4 text-gray-600">{formatCentavos(i.costPerUnit)}</td>
                <td className="py-2 pr-4 text-gray-600">{i.supplier?.name || "—"}</td>
                {isOwner && (
                  <td className="py-2 pr-4">
                    <Link href={`/inventory/${i.id}/edit`} className="text-orange-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {isOwner && (
        <div className="mt-8 max-w-lg">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Record Stock Movement</h2>
          <form action={recordStockMovement} className="space-y-4">
            <FormSelect
              label="Ingredient"
              name="ingredientId"
              required
              options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
            />
            <FormSelect
              label="Type"
              name="type"
              required
              options={[
                { value: "STOCK_IN", label: "Stock In (receiving)" },
                { value: "STOCK_OUT_WASTE", label: "Waste / Spoilage" },
                { value: "ADJUSTMENT", label: "Adjustment (recount, +/-)" },
              ]}
            />
            <FormField label="Quantity" name="quantity" type="number" step="0.01" required />
            <FormField label="Reason / Notes" name="reason" />
            <SubmitButton>Record</SubmitButton>
          </form>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Recent Stock Movements</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Ingredient</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Qty</th>
              <th className="py-2 pr-4">Reason</th>
              <th className="py-2 pr-4">By</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-600">{log.createdAt.toLocaleString()}</td>
                <td className="py-2 pr-4 text-gray-900">{log.ingredient.name}</td>
                <td className="py-2 pr-4 text-gray-600">{log.type}</td>
                <td className="py-2 pr-4 text-gray-600">
                  {log.quantity} {log.ingredient.unit}
                </td>
                <td className="py-2 pr-4 text-gray-600">{log.reason || "—"}</td>
                <td className="py-2 pr-4 text-gray-600">{log.user?.name || "—"}</td>
              </tr>
            ))}
            {recentLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-400">
                  No stock movements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
