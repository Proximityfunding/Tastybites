import { formatCentavos } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orderStatus";
import type { Order, OrderItem, Product, Customer } from "@prisma/client";

type ReceiptOrder = Order & {
  items: (OrderItem & { product: Product })[];
  customer: Customer | null;
};

export default function Receipt({
  order,
  branch,
}: {
  order: ReceiptOrder;
  branch: { name: string; address: string | null; phone: string | null };
}) {
  const change = order.paymentMethod === "CASH" ? order.amountPaid - order.total : 0;

  return (
    <div className="hidden print:block">
      <div className="mx-auto w-full max-w-xs font-mono text-[11px] leading-snug text-black">
        <div className="text-center">
          <div className="text-sm font-bold">{branch.name}</div>
          {branch.address && <div>{branch.address}</div>}
          {branch.phone && <div>{branch.phone}</div>}
        </div>

        <Divider />

        <div className="text-center font-bold">ORDER ACKNOWLEDGEMENT</div>

        <Divider />

        <Row label="Order #" value={order.id.slice(-8).toUpperCase()} />
        <Row label="Date" value={order.createdAt.toLocaleString()} />
        <Row label="Channel" value={order.channel.replace("_", " ")} />
        <Row label="Status" value={STATUS_LABELS[order.status]} />
        {order.customer && <Row label="Customer" value={order.customer.name} />}
        {order.customer?.phone && <Row label="Phone" value={order.customer.phone} />}

        <Divider />

        {order.items.map((item) => (
          <div key={item.id} className="mb-1">
            <div className="flex justify-between">
              <span>
                {item.qty}x {item.product.name}
              </span>
              <span>{formatCentavos(item.lineTotal)}</span>
            </div>
            {item.modifiers && (item.modifiers as { note?: string }).note && (
              <div className="pl-3 text-[10px] italic">{(item.modifiers as { note?: string }).note}</div>
            )}
          </div>
        ))}

        <Divider />

        <Row label="Subtotal" value={formatCentavos(order.subtotal)} />
        {order.discount > 0 && <Row label="Discount" value={`-${formatCentavos(order.discount)}`} />}
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatCentavos(order.total)}</span>
        </div>

        <Divider />

        <Row label="Payment" value={order.paymentMethod} />
        {order.paymentMethod === "CASH" && (
          <>
            <Row label="Amount Paid" value={formatCentavos(order.amountPaid)} />
            {change > 0 && <Row label="Change" value={formatCentavos(change)} />}
          </>
        )}

        {order.notes && (
          <>
            <Divider />
            <div>Notes: {order.notes}</div>
          </>
        )}

        <Divider />

        <div className="text-center">
          <div>Thank you for your order!</div>
          <div>Please come again.</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="my-1 border-t border-dashed border-black" />;
}
