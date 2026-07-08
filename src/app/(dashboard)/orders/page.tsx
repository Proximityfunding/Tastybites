import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import { STATUS_LABELS, STATUS_COLORS, NEXT_STATUS } from "@/lib/orderStatus";
import { changeOrderStatus } from "./actions";
import type { OrderStatus } from "@prisma/client";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; channel?: string }>;
}) {
  const session = await auth();
  const { status, channel } = await searchParams;
  const isKitchen = session!.user.role === "KITCHEN";

  const orders = await db.order.findMany({
    where: {
      branchId: session!.user.branchId,
      ...(isKitchen
        ? { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] } }
        : status
          ? { status: status as OrderStatus }
          : {}),
      ...(channel ? { channel: channel as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, customer: true },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        {!isKitchen && (
          <Link
            href="/orders/new"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Quick Order Entry
          </Link>
        )}
      </div>

      {!isKitchen && (
        <div className="mb-4 flex gap-4 text-sm">
          <FilterLink label="All Statuses" param="status" value={undefined} current={status} />
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <FilterLink key={value} label={label} param="status" value={value} current={status} />
          ))}
        </div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Order</th>
            <th className="py-2 pr-4">Channel</th>
            <th className="py-2 pr-4">Items</th>
            <th className="py-2 pr-4">Total</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Customer</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <tr key={order.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  <Link href={`/orders/${order.id}`} className="font-medium text-orange-600 hover:underline">
                    #{order.id.slice(-6)}
                  </Link>
                  <div className="text-xs text-gray-400">{order.createdAt.toLocaleString()}</div>
                </td>
                <td className="py-2 pr-4 text-gray-600">{order.channel}</td>
                <td className="py-2 pr-4 text-gray-600">{order.items.length} item(s)</td>
                <td className="py-2 pr-4 text-gray-600">{formatCentavos(order.total)}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-600">{order.customer?.name || "—"}</td>
                <td className="py-2 pr-4">
                  {next && (
                    <form action={changeOrderStatus.bind(null, order.id, next)} className="inline">
                      <button type="submit" className="text-orange-600 hover:underline">
                        Mark {STATUS_LABELS[next]}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-center text-gray-400">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FilterLink({
  label,
  param,
  value,
  current,
}: {
  label: string;
  param: string;
  value: string | undefined;
  current: string | undefined;
}) {
  const isActive = current === value;
  const href = value ? `/orders?${param}=${value}` : "/orders";
  return (
    <Link href={href} className={isActive ? "font-semibold text-orange-600" : "text-gray-500 hover:text-gray-800"}>
      {label}
    </Link>
  );
}
