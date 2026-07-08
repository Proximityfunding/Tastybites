import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orderStatus";
import Logo from "@/components/Logo";
import ClearCartOnMount from "../ClearCartOnMount";

const TRACKER_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"] as const;

export default async function ThankYouPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, delivery: true },
  });
  if (!order) notFound();

  const isTerminal = order.status === "CANCELLED" || order.status === "VOIDED";
  const relevantSteps: (typeof TRACKER_STEPS)[number][] = order.isPickup
    ? TRACKER_STEPS.filter((s) => s !== "OUT_FOR_DELIVERY")
    : [...TRACKER_STEPS];
  const currentIndex = relevantSteps.indexOf(order.status as (typeof TRACKER_STEPS)[number]);

  return (
    <div className="min-h-screen bg-orange-50/40">
      <ClearCartOnMount />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-gray-500">Order #{order.id.slice(-6)}</p>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Thank you for your order!</h1>

        {isTerminal ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            This order was {STATUS_LABELS[order.status].toLowerCase()}
            {order.voidReason ? `: ${order.voidReason}` : "."}
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between">
            {relevantSteps.map((step, i) => (
              <div key={step} className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`h-3 w-3 rounded-full ${i <= currentIndex ? "bg-orange-600" : "bg-gray-300"}`}
                />
                <span className={`mt-1 text-xs ${i <= currentIndex ? "text-orange-600" : "text-gray-400"}`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md border border-gray-200 bg-white p-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-1 text-sm">
              <span>
                {item.qty}× {item.product.name}
              </span>
              <span>{formatCentavos(item.lineTotal)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCentavos(order.total)}</span>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          {order.isPickup ? "Pickup" : "Delivery"} · Payment collected on {order.isPickup ? "pickup" : "delivery"}
        </p>

        <Link href="/shop" className="mt-6 inline-block text-sm text-orange-600 hover:underline">
          ← Back to menu
        </Link>
      </div>
    </div>
  );
}
