import type { Order, OrderItem, Product, Customer } from "@prisma/client";

type SlipOrder = Order & {
  items: (OrderItem & { product: Product })[];
  customer: Customer | null;
};

const CHANNEL_LABEL: Record<string, string> = {
  DINE_IN: "Dine-in",
  WALK_IN: "Walk-in",
  ONLINE: "Online",
};

/** Print-only kitchen-style order slip, patterned after the KDS order card. */
export default function OrderSlip({ order }: { order: SlipOrder }) {
  return (
    <div className="hidden print:block">
      <div className="mx-auto w-full pl-[2mm] pr-[5mm] text-xs text-black">
        <div className="mb-2">
          <div className="text-lg font-extrabold">#{order.id.slice(-6)}</div>
          {order.customer?.name && <div className="text-sm font-semibold">{order.customer.name}</div>}
          <div className="mt-0.5 text-xs font-medium">
            {CHANNEL_LABEL[order.channel] || order.channel}
            {order.isPickup ? " · Pickup" : ""}
          </div>
        </div>

        <div className="space-y-1">
          {order.items.map((item) => (
            <div key={item.id}>
              <div className="font-semibold">
                {item.qty}× {item.product.name}
              </div>
              {item.modifiers && (item.modifiers as { note?: string }).note && (
                <div className="pl-4 text-xs italic text-gray-600">
                  {(item.modifiers as { note?: string }).note}
                </div>
              )}
            </div>
          ))}
        </div>

        {order.notes && <div className="mt-2 text-xs italic">Notes: {order.notes}</div>}

        <div className="mt-3 text-right text-xs text-gray-500">{order.createdAt.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
