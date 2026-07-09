import { notFound } from "next/navigation";
import Link from "next/link";
import { Wallet, CalendarClock } from "lucide-react";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/orderStatus";
import { FormField, SubmitButton } from "@/components/FormField";
import StatCard from "@/components/StatCard";
import { requirePagePermission } from "@/lib/access";
import { updateCustomer } from "../actions";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("customers");
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!customer) notFound();

  const updateWithId = updateCustomer.bind(null, customer.id);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">{customer.name}</h1>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <StatCard label="Total Spend" value={formatCentavos(customer.totalSpend)} color="green" icon={Wallet} />
          <StatCard
            label="Last Order"
            value={customer.lastOrderAt?.toLocaleDateString() || "—"}
            color="blue"
            icon={CalendarClock}
          />
        </div>

        <form action={updateWithId} className="max-w-sm space-y-4">
          <FormField label="Name" name="name" required defaultValue={customer.name} />
          <FormField label="Phone" name="phone" defaultValue={customer.phone ?? ""} />
          <FormField label="Address" name="address" defaultValue={customer.address ?? ""} />
          <FormField label="Facebook Handle" name="fbHandle" defaultValue={customer.fbHandle ?? ""} />
          <FormField label="Tags (comma-separated)" name="tags" defaultValue={customer.tags.join(", ")} />
          <SubmitButton />
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Order History</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Order</th>
              <th className="py-2 pr-4">Channel</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {customer.orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  <Link href={`/orders/${o.id}`} className="text-orange-600 hover:underline">
                    #{o.id.slice(-6)}
                  </Link>
                  <div className="text-xs text-gray-400">{o.createdAt.toLocaleDateString()}</div>
                </td>
                <td className="py-2 pr-4 text-gray-600">{o.channel}</td>
                <td className="py-2 pr-4 text-gray-600">{formatCentavos(o.total)}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
              </tr>
            ))}
            {customer.orders.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
