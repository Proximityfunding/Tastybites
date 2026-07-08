import Link from "next/link";
import { Truck, Timer, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import StatCard from "@/components/StatCard";

const ON_TIME_SLA_MINUTES = 60;

export default async function DeliveriesPage() {
  const session = await auth();
  const deliveries = await db.delivery.findMany({
    where: { order: { branchId: session!.user.branchId } },
    orderBy: { createdAt: "desc" },
    include: { order: { include: { customer: true } } },
  });

  const delivered = deliveries.filter((d) => d.status === "DELIVERED" && d.dispatchedAt && d.deliveredAt);
  const onTime = delivered.filter((d) => {
    const minutes = (d.deliveredAt!.getTime() - d.dispatchedAt!.getTime()) / 60000;
    return minutes <= ON_TIME_SLA_MINUTES;
  });
  const onTimeRate = delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : null;
  const totalFees = deliveries.reduce((sum, d) => sum + d.deliveryFee, 0);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Deliveries</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total Deliveries" value={String(deliveries.length)} color="blue" icon={Truck} />
        <StatCard
          label={`On-Time Rate (≤${ON_TIME_SLA_MINUTES}min)`}
          value={onTimeRate !== null ? `${onTimeRate}%` : "—"}
          color="green"
          icon={Timer}
        />
        <StatCard label="Total Delivery Fees" value={formatCentavos(totalFees)} color="purple" icon={Wallet} />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Order</th>
            <th className="py-2 pr-4">Rider</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Fee</th>
            <th className="py-2 pr-4">Customer</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="border-b border-gray-100">
              <td className="py-2 pr-4">
                <Link href={`/deliveries/${d.id}`} className="font-medium text-orange-600 hover:underline">
                  #{d.orderId.slice(-6)}
                </Link>
              </td>
              <td className="py-2 pr-4 text-gray-600">{d.riderProvider || "—"}</td>
              <td className="py-2 pr-4 text-gray-600">{d.status}</td>
              <td className="py-2 pr-4 text-gray-600">{formatCentavos(d.deliveryFee)}</td>
              <td className="py-2 pr-4 text-gray-600">{d.order.customer?.name || "—"}</td>
            </tr>
          ))}
          {deliveries.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-400">
                No deliveries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
