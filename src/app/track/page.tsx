import Link from "next/link";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orderStatus";
import Logo from "@/components/Logo";

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  const { phone } = await searchParams;

  const orders = phone
    ? await db.order.findMany({
        where: { channel: "ONLINE", customer: { phone } },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="min-h-screen bg-orange-50/40">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-xl font-bold text-gray-900">Track Your Order</h1>
        <form className="flex gap-2">
          <input
            name="phone"
            defaultValue={phone}
            placeholder="Enter your phone number"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </form>

        {phone && (
          <div className="mt-6 space-y-3">
            {orders.length === 0 && <p className="text-sm text-gray-400">No orders found for that number.</p>}
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/shop/thank-you/${order.id}`}
                className="block rounded-md border border-gray-200 bg-white p-4 hover:border-orange-400"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Order #{order.id.slice(-6)}</span>
                  <span className="text-gray-500">{STATUS_LABELS[order.status]}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {order.createdAt.toLocaleDateString()} · {formatCentavos(order.total)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
