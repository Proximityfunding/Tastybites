import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { resolvePeriod } from "@/lib/period";
import { formatCentavos } from "@/lib/money";
import PeriodSelector from "../PeriodSelector";

function sum(entries: { debit: number; credit: number }[], field: "debit" | "credit") {
  return entries.reduce((s, e) => s + e[field], 0);
}

export default async function PnLPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const user = await requirePageRole("OWNER_ADMIN");
  const { period, from, to } = resolvePeriod(sp);
  const branchId = user.branchId;

  const entries = await db.ledgerEntry.findMany({
    where: { branchId, date: { gte: from, lte: to } },
    include: { account: true },
  });

  const revenueEntries = entries.filter((e) => e.account.type === "REVENUE");
  const revenue = sum(revenueEntries, "credit") - sum(revenueEntries, "debit");

  const cogsEntries = entries.filter((e) => e.account.code === "5000");
  const cogs = sum(cogsEntries, "debit") - sum(cogsEntries, "credit");
  const grossProfit = revenue - cogs;

  const opExEntries = entries.filter((e) => e.account.type === "EXPENSE" && e.account.code !== "5000");
  const byAccount = new Map<string, number>();
  for (const e of opExEntries) {
    byAccount.set(e.account.name, (byAccount.get(e.account.name) || 0) + e.debit - e.credit);
  }
  const totalOperatingExpenses = Array.from(byAccount.values()).reduce((a, b) => a + b, 0);
  const netIncome = grossProfit - totalOperatingExpenses;

  return (
    <div className="max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">P&amp;L / Income Statement</h1>
        <a
          href={`/api/reports/export?type=pnl&from=${from.toISOString()}&to=${to.toISOString()}`}
          className="text-sm text-orange-600 hover:underline"
        >
          Export CSV
        </a>
      </div>
      <PeriodSelector basePath="/pnl" current={period} />

      <div className="rounded-md border border-gray-200 bg-white p-6 text-sm">
        <Row label="Sales Revenue" value={revenue} />
        <Row label="Cost of Goods Sold" value={-cogs} />
        <Row label="Gross Profit" value={grossProfit} bold divider />

        <div className="mt-3 mb-1 text-xs font-semibold uppercase text-gray-400">Operating Expenses</div>
        {Array.from(byAccount.entries()).map(([name, amount]) => (
          <Row key={name} label={name} value={-amount} />
        ))}
        <Row label="Total Operating Expenses" value={-totalOperatingExpenses} divider />

        <Row label="Net Income" value={netIncome} bold divider />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  divider,
}: {
  label: string;
  value: number;
  bold?: boolean;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1 ${divider ? "border-t border-gray-200 pt-2 mt-1" : ""} ${
        bold ? "font-semibold text-gray-900" : "text-gray-700"
      }`}
    >
      <span>{label}</span>
      <span className={value < 0 ? "text-red-600" : ""}>{formatCentavos(value)}</span>
    </div>
  );
}
