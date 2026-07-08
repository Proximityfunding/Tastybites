import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { STATUS_LABELS, KITCHEN_NEXT_STATUS, KDS_ACTIVE_STATUSES } from "@/lib/orderStatus";
import { changeOrderStatus } from "../orders/actions";
import AutoRefresh from "@/components/AutoRefresh";
import type { OrderStatus } from "@prisma/client";

const COLUMN_STYLE: Record<string, { header: string; badge: string }> = {
  PENDING: { header: "border-gray-300", badge: "bg-gray-100 text-gray-700" },
  CONFIRMED: { header: "border-sky-300", badge: "bg-sky-100 text-sky-700" },
  PREPARING: { header: "border-amber-300", badge: "bg-amber-100 text-amber-700" },
  READY: { header: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700" },
};

const CHANNEL_LABEL: Record<string, string> = {
  DINE_IN: "Dine-in",
  WALK_IN: "Walk-in",
  ONLINE: "Online",
};

function elapsedMinutes(createdAt: Date) {
  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
}

function urgencyClasses(minutes: number) {
  if (minutes >= 20) return { border: "border-red-400", text: "text-red-600 font-bold" };
  if (minutes >= 10) return { border: "border-amber-400", text: "text-amber-600 font-semibold" };
  return { border: "border-gray-200", text: "text-gray-400" };
}

export default async function KitchenDisplayPage() {
  const user = await requirePageRole("OWNER_ADMIN", "CASHIER_STAFF", "KITCHEN");

  const orders = await db.order.findMany({
    where: { branchId: user.branchId, status: { in: KDS_ACTIVE_STATUSES } },
    orderBy: { createdAt: "asc" },
    include: { items: { include: { product: true } } },
  });

  const columns = KDS_ACTIVE_STATUSES.map((status) => ({
    status,
    orders: orders.filter((o) => o.status === status),
  }));

  return (
    <div>
      <AutoRefresh />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Kitchen Display</h1>
        <span className="text-xs text-gray-400">Auto-refreshes every 15s</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map(({ status, orders: columnOrders }) => {
          const style = COLUMN_STYLE[status];
          const nextStatus = KITCHEN_NEXT_STATUS[status];
          return (
            <div key={status} className="flex flex-col">
              <div className={`mb-3 flex items-center justify-between border-b-2 pb-2 ${style.header}`}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">{STATUS_LABELS[status]}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.badge}`}>
                  {columnOrders.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnOrders.map((order) => {
                  const minutes = elapsedMinutes(order.createdAt);
                  const urgency = urgencyClasses(minutes);
                  return (
                    <div
                      key={order.id}
                      className={`rounded-lg border-l-4 bg-white p-3 shadow-sm ${urgency.border}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-gray-900">#{order.id.slice(-6)}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                          {CHANNEL_LABEL[order.channel] ?? order.channel}
                        </span>
                      </div>

                      <ul className="mb-3 space-y-1 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <span className="font-semibold text-gray-900">{item.qty}×</span>{" "}
                            <span className="text-gray-800">{item.product.name}</span>
                            {item.modifiers && (item.modifiers as { note?: string }).note && (
                              <div className="ml-4 text-xs italic text-gray-500">
                                {(item.modifiers as { note?: string }).note}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className={urgency.text}>
                          {minutes === 0 ? "just now" : `${minutes} min ago`}
                        </span>
                        <span className="text-gray-400">{order.createdAt.toLocaleTimeString()}</span>
                      </div>

                      {nextStatus && (
                        <form action={changeOrderStatus.bind(null, order.id, nextStatus as OrderStatus)}>
                          <button
                            type="submit"
                            className="w-full rounded-md bg-orange-600 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                          >
                            Mark {STATUS_LABELS[nextStatus]}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}

                {columnOrders.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                    No orders
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
