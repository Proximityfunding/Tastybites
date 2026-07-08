import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatCentavos } from "@/lib/money";
import { FormField, FormSelect, SubmitButton } from "@/components/FormField";
import { createDelivery } from "../actions";

export default async function NewDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await db.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Assign Delivery</h1>
      <p className="mb-4 text-sm text-gray-500">
        Order #{order.id.slice(-6)} · {order.customer?.name} · {formatCentavos(order.total)}
      </p>
      <form action={createDelivery} className="space-y-4">
        <input type="hidden" name="orderId" value={order.id} />
        <FormField label="Rider / Provider (e.g. Lalamove)" name="riderProvider" placeholder="Lalamove" />
        <FormField label="Rider Contact" name="riderContact" />
        <FormField label="Delivery Fee (₱)" name="deliveryFee" type="number" step="0.01" defaultValue={0} />
        <FormSelect
          label="Status"
          name="status"
          defaultValue="DISPATCHED"
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "DISPATCHED", label: "Dispatched" },
          ]}
        />
        <FormField label="Notes" name="notes" />
        <SubmitButton />
      </form>
    </div>
  );
}
