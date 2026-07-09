import { requirePagePermission } from "@/lib/access";
import { db } from "@/lib/db";
import { resolvePeriod } from "@/lib/period";
import { formatCentavos } from "@/lib/money";
import PeriodSelector from "../PeriodSelector";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  CARD: "Card",
  UNPAID: "Unpaid",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; channel?: string }>;
}) {
  const sp = await searchParams;
  const user = await requirePagePermission("reports");
  const { period, from, to } = resolvePeriod(sp);
  const branchId = user.branchId;

  const orders = await db.order.findMany({
    where: {
      branchId,
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
      ...(sp.channel ? { channel: sp.channel as never } : {}),
    },
    include: { items: true },
  });

  const salesByChannel = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const bucket = salesByChannel.get(o.channel) || { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += o.total;
    salesByChannel.set(o.channel, bucket);
  }
  const totalSales = orders.reduce((s, o) => s + o.total, 0);

  const paidOrders = orders.filter((o) => o.paymentMethod !== "UNPAID");
  const salesByPayment = new Map<string, { count: number; total: number }>();
  for (const o of paidOrders) {
    const bucket = salesByPayment.get(o.paymentMethod) || { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += o.total;
    salesByPayment.set(o.paymentMethod, bucket);
  }
  const totalPaidSales = paidOrders.reduce((s, o) => s + o.total, 0);

  const expenses = await db.expense.findMany({
    where: { branchId, date: { gte: from, lte: to } },
  });
  const expensesByCategory = new Map<string, number>();
  for (const e of expenses) {
    expensesByCategory.set(e.category, (expensesByCategory.get(e.category) || 0) + e.amount);
  }
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <div className="flex gap-3 text-sm">
          <a
            href={`/api/reports/export?type=sales&from=${from.toISOString()}&to=${to.toISOString()}`}
            className="text-orange-600 hover:underline"
          >
            Export Sales CSV
          </a>
          <a
            href={`/api/reports/export?type=expenses&from=${from.toISOString()}&to=${to.toISOString()}`}
            className="text-orange-600 hover:underline"
          >
            Export Expenses CSV
          </a>
        </div>
      </div>
      <PeriodSelector basePath="/reports" current={period} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Sales by Channel</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Orders</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(salesByChannel.entries()).map(([channel, data]) => (
                <tr key={channel} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-900">{channel}</td>
                  <td className="py-2 pr-4 text-gray-600">{data.count}</td>
                  <td className="py-2 pr-4 text-gray-600">{formatCentavos(data.total)}</td>
                </tr>
              ))}
              <tr className="font-semibold text-gray-900">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4">{orders.length}</td>
                <td className="py-2 pr-4">{formatCentavos(totalSales)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Sales by Payment Method</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Orders</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(salesByPayment.entries()).map(([method, data]) => (
                <tr key={method} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-900">{PAYMENT_LABELS[method] || method}</td>
                  <td className="py-2 pr-4 text-gray-600">{data.count}</td>
                  <td className="py-2 pr-4 text-gray-600">{formatCentavos(data.total)}</td>
                </tr>
              ))}
              {paidOrders.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-2 pr-4 text-gray-400">
                    No paid orders in this period.
                  </td>
                </tr>
              )}
              <tr className="font-semibold text-gray-900">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4">{paidOrders.length}</td>
                <td className="py-2 pr-4">{formatCentavos(totalPaidSales)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Expenses by Category</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(expensesByCategory.entries()).map(([category, total]) => (
                <tr key={category} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-900">{category}</td>
                  <td className="py-2 pr-4 text-gray-600">{formatCentavos(total)}</td>
                </tr>
              ))}
              <tr className="font-semibold text-gray-900">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4">{formatCentavos(totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
