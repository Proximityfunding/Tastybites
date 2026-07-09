import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/access";
import { formatCentavos, centavosToPesos } from "@/lib/money";
import { FormField, FormSelect, SubmitButton } from "@/components/FormField";
import { updateDelivery } from "../actions";

export default async function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("deliveries");
  const { id } = await params;
  const delivery = await db.delivery.findUnique({
    where: { id },
    include: { order: { include: { customer: true } } },
  });
  if (!delivery) notFound();

  const updateWithId = updateDelivery.bind(null, delivery.id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Delivery</h1>
      <p className="mb-4 text-sm text-gray-500">
        <Link href={`/orders/${delivery.orderId}`} className="text-orange-600 hover:underline">
          Order #{delivery.orderId.slice(-6)}
        </Link>{" "}
        · {delivery.order.customer?.name} · {formatCentavos(delivery.order.total)}
      </p>

      {delivery.proofUrl && (
        <Image
          src={delivery.proofUrl}
          alt="Proof of delivery"
          width={200}
          height={200}
          className="mb-4 rounded-md object-cover"
        />
      )}

      <form action={updateWithId} className="space-y-4">
        <FormField label="Rider / Provider" name="riderProvider" defaultValue={delivery.riderProvider ?? ""} />
        <FormField label="Rider Contact" name="riderContact" defaultValue={delivery.riderContact ?? ""} />
        <FormField
          label="Delivery Fee (₱)"
          name="deliveryFee"
          type="number"
          step="0.01"
          defaultValue={centavosToPesos(delivery.deliveryFee)}
        />
        <FormSelect
          label="Status"
          name="status"
          defaultValue={delivery.status}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "DISPATCHED", label: "Dispatched" },
            { value: "DELIVERED", label: "Delivered" },
            { value: "FAILED", label: "Failed" },
            { value: "RETURNED", label: "Returned" },
          ]}
        />
        <div>
          <label htmlFor="proof" className="block text-sm font-medium text-gray-700">
            Proof of Delivery (photo)
          </label>
          <input id="proof" name="proof" type="file" accept="image/*" className="mt-1 text-sm" />
        </div>
        <FormField label="Notes" name="notes" defaultValue={delivery.notes ?? ""} />
        <p className="text-xs text-gray-500">
          Dispatched: {delivery.dispatchedAt?.toLocaleString() ?? "—"} · Delivered:{" "}
          {delivery.deliveredAt?.toLocaleString() ?? "—"}
        </p>
        <SubmitButton />
      </form>
    </div>
  );
}
