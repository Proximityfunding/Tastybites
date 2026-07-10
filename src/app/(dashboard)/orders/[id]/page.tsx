import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/access";
import { getDefaultBranch } from "@/lib/branch";
import { formatCentavos } from "@/lib/money";
import { STATUS_LABELS, STATUS_COLORS, NEXT_STATUS } from "@/lib/orderStatus";
import { changeOrderStatus, voidOrderAction } from "../actions";
import PrintReceiptButton from "../PrintReceiptButton";
import RecordPaymentButton from "../RecordPaymentButton";
import Receipt from "../Receipt";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("orders");
  const { id } = await params;
  const session = await auth();
  const [order, branch] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true, delivery: true },
    }),
    getDefaultBranch(),
  ]);
  if (!order) notFound();

  const next = NEXT_STATUS[order.status];
  const isOwner = session!.user.role === "OWNER_ADMIN";
  const canVoid = isOwner && order.status !== "VOIDED";

  return (
    <div className="max-w-2xl">
      <Receipt order={order} branch={branch} />

      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-gray-900">Order #{order.id.slice(-6)}</h1>
        <PrintReceiptButton />
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-6 print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">{order.createdAt.toLocaleString()}</div>
            <div className="text-sm text-gray-500">
              {order.channel} {order.isPickup ? "· Pickup" : ""}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {order.customer && (
          <div className="mb-4 text-sm text-gray-700">
            <div className="font-medium">{order.customer.name}</div>
            <div className="text-gray-500">{order.customer.phone}</div>
          </div>
        )}

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-1 pr-4">Item</th>
              <th className="py-1 pr-4">Qty</th>
              <th className="py-1 pr-4">Price</th>
              <th className="py-1 pr-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-1 pr-4">
                  {item.product.name}
                  {item.modifiers && (item.modifiers as { note?: string }).note && (
                    <div className="text-xs text-gray-400">{(item.modifiers as { note?: string }).note}</div>
                  )}
                </td>
                <td className="py-1 pr-4">{item.qty}</td>
                <td className="py-1 pr-4">{formatCentavos(item.unitPrice)}</td>
                <td className="py-1 pr-4">{formatCentavos(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCentavos(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Discount</span>
              <span>-{formatCentavos(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCentavos(order.total)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Payment</span>
            <span>{order.paymentMethod}</span>
          </div>
        </div>

        {order.notes && <p className="mt-4 text-sm text-gray-500">Notes: {order.notes}</p>}
        {order.voidReason && <p className="mt-4 text-sm text-red-600">Voided: {order.voidReason}</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
        {next && (
          <form action={changeOrderStatus.bind(null, order.id, next)}>
            <button type="submit" className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
              Mark {STATUS_LABELS[next]}
            </button>
          </form>
        )}
        {order.status === "COMPLETED" && order.paymentMethod === "UNPAID" && (
          <RecordPaymentButton orderId={order.id} total={order.total} />
        )}
        {order.channel === "ONLINE" && !order.isPickup && !order.delivery && order.status !== "VOIDED" && (
          <Link href={`/deliveries/new?orderId=${order.id}`} className="text-sm text-orange-600 hover:underline">
            Assign Delivery
          </Link>
        )}
        {order.delivery && (
          <Link href={`/deliveries/${order.delivery.id}`} className="text-sm text-orange-600 hover:underline">
            View Delivery
          </Link>
        )}
      </div>

      {canVoid && (
        <form action={voidOrderAction.bind(null, order.id)} className="mt-6 max-w-sm print:hidden">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            Void reason
          </label>
          <input
            id="reason"
            name="reason"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="mt-2 rounded-md border border-red-300 px-4 py-2 text-sm text-red-600">
            Void Order
          </button>
        </form>
      )}
    </div>
  );
}
