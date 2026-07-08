import Link from "next/link";
import { TrendingUp, PackageX, Truck, Receipt, Users, Repeat } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import { getPeakHoursHeatmap, getBestSellers, getCustomerInsights } from "@/lib/analytics";
import StatCard from "@/components/StatCard";
import PeakHoursHeatmap from "./PeakHoursHeatmap";

export default async function DashboardPage() {
  const session = await auth();
  const branchId = session!.user.branchId;
  const role = session!.user.role;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayOrders, lowStockIngredients, pendingDeliveries] = await Promise.all([
    db.order.findMany({ where: { branchId, status: "COMPLETED", createdAt: { gte: todayStart } } }),
    db.ingredient.findMany({ where: { branchId } }),
    db.delivery.count({ where: { order: { branchId }, status: { in: ["PENDING", "DISPATCHED"] } } }),
  ]);

  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const lowStockCount = lowStockIngredients.filter((i) => i.stockQty <= i.reorderLevel).length;

  if (role !== "OWNER_ADMIN") {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Today's Sales" value={formatCentavos(todaySales)} color="green" icon={TrendingUp} />
          <StatCard
            label="Low Stock Items"
            value={String(lowStockCount)}
            href="/inventory"
            color="amber"
            icon={PackageX}
          />
          <StatCard
            label="Pending Deliveries"
            value={String(pendingDeliveries)}
            href="/deliveries"
            color="blue"
            icon={Truck}
          />
        </div>
        <div className="mt-6 flex gap-4 text-sm">
          {role === "KITCHEN" ? (
            <Link href="/kitchen" className="text-orange-600 hover:underline">
              Go to Kitchen Display →
            </Link>
          ) : (
            <>
              <Link href="/pos" className="text-orange-600 hover:underline">
                Go to POS →
              </Link>
              <Link href="/orders" className="text-orange-600 hover:underline">
                View Orders →
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const [heatmap, bestSellers, customerInsights] = await Promise.all([
    getPeakHoursHeatmap(branchId),
    getBestSellers(branchId),
    getCustomerInsights(branchId),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today's Sales" value={formatCentavos(todaySales)} color="green" icon={TrendingUp} />
        <StatCard
          label="Low Stock Items"
          value={String(lowStockCount)}
          href="/inventory"
          color="amber"
          icon={PackageX}
        />
        <StatCard
          label="Pending Deliveries"
          value={String(pendingDeliveries)}
          href="/deliveries"
          color="blue"
          icon={Truck}
        />
        <StatCard
          label="Avg Order Value (30d)"
          value={formatCentavos(customerInsights.aov)}
          color="purple"
          icon={Receipt}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Peak Hours (last 30 days)</h2>
          <PeakHoursHeatmap {...heatmap} />
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Customer Insights (last 30 days)</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Repeat Customer Rate"
              value={`${customerInsights.repeatRate}%`}
              color="orange"
              icon={Repeat}
            />
            <StatCard
              label="Unique Customers"
              value={String(customerInsights.totalCustomers)}
              color="blue"
              icon={Users}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Best Sellers — by Quantity</h2>
          <RankedList items={bestSellers.byQty.map((p) => ({ label: p.name, value: `${p.qty} sold` }))} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Best Sellers — by Revenue</h2>
          <RankedList items={bestSellers.byRevenue.map((p) => ({ label: p.name, value: formatCentavos(p.revenue) }))} />
        </div>
      </div>
    </div>
  );
}

function RankedList({ items }: { items: { label: string; value: string }[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400">No sales data yet.</p>;
  return (
    <ol className="space-y-1 text-sm">
      {items.map((item, i) => (
        <li key={item.label} className="flex justify-between rounded-lg px-3 py-2 odd:bg-orange-50/60">
          <span className="text-gray-700">
            {i + 1}. {item.label}
          </span>
          <span className="font-semibold text-orange-700">{item.value}</span>
        </li>
      ))}
    </ol>
  );
}
