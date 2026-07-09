import Link from "next/link";
import { Package, Home, Zap, Users, Truck, CircleEllipsis } from "lucide-react";
import { requirePagePermission } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import { generateDueRecurringExpenses } from "@/lib/expenses";
import StatCard, { type StatCardColor } from "@/components/StatCard";

const CATEGORY_STYLE: Record<string, { color: StatCardColor; icon: typeof Package }> = {
  SUPPLIES: { color: "blue", icon: Package },
  RENT: { color: "purple", icon: Home },
  UTILITIES: { color: "amber", icon: Zap },
  SALARIES: { color: "green", icon: Users },
  DELIVERY_FEES: { color: "orange", icon: Truck },
  MISC: { color: "gray", icon: CircleEllipsis },
};

export default async function ExpensesPage() {
  const user = await requirePagePermission("expenses");
  const branchId = user.branchId;

  await generateDueRecurringExpenses(branchId, user.id);

  const expenses = await db.expense.findMany({
    where: { branchId },
    orderBy: { date: "desc" },
    take: 100,
  });

  const totalsByCategory = new Map<string, number>();
  for (const e of expenses) {
    totalsByCategory.set(e.category, (totalsByCategory.get(e.category) || 0) + e.amount);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <Link
          href="/expenses/new"
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Record Expense
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from(totalsByCategory.entries()).map(([category, total]) => {
          const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.MISC;
          return (
            <StatCard
              key={category}
              label={category.replace("_", " ")}
              value={formatCentavos(total)}
              color={style.color}
              icon={style.icon}
            />
          );
        })}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Vendor</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Recurring</th>
            <th className="py-2 pr-4">Notes</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => {
            const style = CATEGORY_STYLE[e.category] ?? CATEGORY_STYLE.MISC;
            return (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-600">{e.date.toLocaleDateString()}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      { orange: "bg-orange-100 text-orange-700", green: "bg-emerald-100 text-emerald-700", blue: "bg-sky-100 text-sky-700", purple: "bg-violet-100 text-violet-700", amber: "bg-amber-100 text-amber-700", red: "bg-rose-100 text-rose-700", gray: "bg-gray-100 text-gray-700" }[style.color]
                    }`}
                  >
                    {e.category.replace("_", " ")}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-600">{e.vendor || "—"}</td>
                <td className="py-2 pr-4 text-gray-600">{formatCentavos(e.amount)}</td>
                <td className="py-2 pr-4 text-gray-600">
                  {e.isRecurring ? `Yes (${e.recurrenceInterval})` : e.recurrenceParentId ? "Auto-generated" : "—"}
                </td>
                <td className="py-2 pr-4 text-gray-600">{e.notes || "—"}</td>
              </tr>
            );
          })}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-400">
                No expenses recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
