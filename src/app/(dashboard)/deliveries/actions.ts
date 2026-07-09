"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { pesosToCentavos } from "@/lib/money";
import { updateOrderStatus } from "@/lib/orders";
import { saveUploadedFile } from "@/lib/upload";
import { logAudit } from "@/lib/audit";
import type { DeliveryStatus } from "@prisma/client";

export async function createDelivery(formData: FormData) {
  const user = await requirePermission("deliveries");
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "PENDING") as DeliveryStatus;
  if (!orderId) throw new Error("orderId is required");

  const delivery = await db.delivery.create({
    data: {
      orderId,
      riderProvider: String(formData.get("riderProvider") || "").trim() || null,
      riderContact: String(formData.get("riderContact") || "").trim() || null,
      deliveryFee: pesosToCentavos(Number(formData.get("deliveryFee") || 0)),
      status,
      dispatchedAt: status === "DISPATCHED" ? new Date() : null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });

  await logAudit({
    userId: user.id,
    action: "DELIVERY_CREATE",
    entityType: "Delivery",
    entityId: delivery.id,
    orderId,
    after: { status: delivery.status, riderProvider: delivery.riderProvider },
  });

  revalidatePath("/deliveries");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/deliveries/${delivery.id}`);
}

export async function updateDelivery(id: string, formData: FormData) {
  const user = await requirePermission("deliveries");
  const existing = await db.delivery.findUniqueOrThrow({ where: { id } });
  const status = String(formData.get("status") || existing.status) as DeliveryStatus;

  const proofFile = formData.get("proof") as File | null;
  const proofUrl = await saveUploadedFile(proofFile, "delivery-proof");

  await db.delivery.update({
    where: { id },
    data: {
      riderProvider: String(formData.get("riderProvider") || "").trim() || null,
      riderContact: String(formData.get("riderContact") || "").trim() || null,
      deliveryFee: pesosToCentavos(Number(formData.get("deliveryFee") || 0)),
      status,
      notes: String(formData.get("notes") || "").trim() || null,
      dispatchedAt: status === "DISPATCHED" && !existing.dispatchedAt ? new Date() : existing.dispatchedAt,
      deliveredAt: status === "DELIVERED" && !existing.deliveredAt ? new Date() : existing.deliveredAt,
      ...(proofUrl ? { proofUrl } : {}),
    },
  });

  if (status !== existing.status) {
    await logAudit({
      userId: user.id,
      action: "DELIVERY_STATUS_CHANGE",
      entityType: "Delivery",
      entityId: id,
      orderId: existing.orderId,
      before: { status: existing.status },
      after: { status },
    });
  }

  if (status === "DELIVERED") {
    await updateOrderStatus(existing.orderId, "COMPLETED", user.id);
  }

  revalidatePath("/deliveries");
  revalidatePath(`/deliveries/${id}`);
  revalidatePath(`/orders/${existing.orderId}`);
  revalidatePath("/inventory");
  revalidatePath("/pnl");
}
