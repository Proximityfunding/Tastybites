import "server-only";
import { db } from "./db";

function toJson(value: unknown) {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export async function logAudit(params: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  orderId?: string | null;
}) {
  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      reason: params.reason ?? null,
      before: toJson(params.before),
      after: toJson(params.after),
      orderId: params.orderId ?? null,
    },
  });
}
