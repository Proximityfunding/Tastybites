import "server-only";
import { db } from "./db";
import { logAudit } from "./audit";
import type { Prisma, OrderChannel, OrderStatus, PaymentMethod } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Prisma's default interactive-transaction timeout (5s) isn't enough here: these
 * transactions do a sequential round trip per recipe ingredient, and the app's
 * region (Vercel, US East) is far from the database's (Supabase, Tokyo) — each
 * round trip costs ~300-400ms, so a multi-item order can exceed 5s on latency alone.
 */
const TX_OPTIONS = { timeout: 20000, maxWait: 10000 };

const COA_CODES = { cash: "1000", inventoryAsset: "1100", salesRevenue: "4000", cogs: "5000" };

async function getAccountIds(tx: TxClient) {
  const accounts = await tx.chartOfAccount.findMany({
    where: { code: { in: Object.values(COA_CODES) } },
  });
  const byCode = new Map(accounts.map((a) => [a.code, a.id]));
  return {
    cash: byCode.get(COA_CODES.cash)!,
    inventoryAsset: byCode.get(COA_CODES.inventoryAsset)!,
    salesRevenue: byCode.get(COA_CODES.salesRevenue)!,
    cogs: byCode.get(COA_CODES.cogs)!,
  };
}

async function deductStockAndComputeCogs(
  tx: TxClient,
  branchId: string,
  orderId: string,
  userId: string | null
): Promise<number> {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    include: { product: { include: { recipe: true } } },
  });

  let cogs = 0;
  for (const item of items) {
    for (const ri of item.product.recipe) {
      const consumeQty = ri.quantity * item.qty;
      const ingredient = await tx.ingredient.update({
        where: { id: ri.ingredientId },
        data: { stockQty: { decrement: consumeQty } },
      });
      cogs += ingredient.costPerUnit * consumeQty;
      await tx.stockLog.create({
        data: {
          branchId,
          ingredientId: ri.ingredientId,
          type: "STOCK_OUT_SALE",
          quantity: consumeQty,
          refOrderId: orderId,
          userId,
        },
      });
    }
  }
  return Math.round(cogs);
}

/** Deducts stock, posts the ledger entries, and marks the order COMPLETED. Idempotent. */
export async function fulfillOrder(orderId: string, userId: string | null) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === "COMPLETED") return order;

    const cogs = await deductStockAndComputeCogs(tx, order.branchId, orderId, userId);
    const accounts = await getAccountIds(tx);

    await tx.ledgerEntry.createMany({
      data: [
        {
          branchId: order.branchId,
          accountId: accounts.cash,
          debit: order.total,
          credit: 0,
          refType: "ORDER",
          orderId,
          description: "Sale payment",
        },
        {
          branchId: order.branchId,
          accountId: accounts.salesRevenue,
          debit: 0,
          credit: order.total,
          refType: "ORDER",
          orderId,
          description: "Sale revenue",
        },
        {
          branchId: order.branchId,
          accountId: accounts.cogs,
          debit: cogs,
          credit: 0,
          refType: "ORDER",
          orderId,
          description: "Cost of goods sold",
        },
        {
          branchId: order.branchId,
          accountId: accounts.inventoryAsset,
          debit: 0,
          credit: cogs,
          refType: "ORDER",
          orderId,
          description: "Inventory used",
        },
      ],
    });

    const updated = await tx.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } });

    if (order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: { totalSpend: { increment: order.total }, lastOrderAt: new Date() },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: "ORDER_STATUS_CHANGE",
        entityType: "Order",
        entityId: orderId,
        orderId,
        before: { status: order.status },
        after: { status: "COMPLETED" },
      },
    });

    return updated;
  }, TX_OPTIONS);
}

/** Any status change should go through here so COMPLETED always triggers stock deduction + ledger posting. */
export async function updateOrderStatus(orderId: string, status: OrderStatus, userId: string | null) {
  if (status === "COMPLETED") {
    return fulfillOrder(orderId, userId);
  }
  const previous = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  const updated = await db.order.update({ where: { id: orderId }, data: { status } });
  await logAudit({
    userId,
    action: "ORDER_STATUS_CHANGE",
    entityType: "Order",
    entityId: orderId,
    orderId,
    before: { status: previous.status },
    after: { status },
  });
  return updated;
}

export type CartItemInput = { productId: string; qty: number; modifiers?: string | null };

export async function createOrder(opts: {
  branchId: string;
  channel: OrderChannel;
  items: CartItemInput[];
  customerId?: string | null;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  discount?: number;
  notes?: string | null;
  isPickup?: boolean;
  createdById?: string | null;
  complete: boolean;
  /** Repeated calls with the same key return the original order instead of creating a duplicate. */
  idempotencyKey?: string | null;
}) {
  if (opts.items.length === 0) throw new Error("Order must have at least one item");

  if (opts.idempotencyKey) {
    const existing = await db.order.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
    if (existing) return existing;
  }

  const products = await db.product.findMany({
    where: { id: { in: opts.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemsData = opts.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Unknown product: ${item.productId}`);
    const lineTotal = product.price * item.qty;
    subtotal += lineTotal;
    return {
      productId: item.productId,
      qty: item.qty,
      unitPrice: product.price,
      modifiers: item.modifiers ? { note: item.modifiers } : undefined,
      lineTotal,
    };
  });

  const discount = opts.discount ?? 0;
  const total = subtotal - discount;

  let order;
  try {
    order = await db.order.create({
      data: {
        branchId: opts.branchId,
        channel: opts.channel,
        status: "PENDING",
        customerId: opts.customerId ?? null,
        subtotal,
        discount,
        total,
        paymentMethod: opts.paymentMethod,
        amountPaid: opts.amountPaid,
        isPickup: opts.isPickup ?? false,
        notes: opts.notes ?? null,
        createdById: opts.createdById ?? null,
        idempotencyKey: opts.idempotencyKey ?? null,
        items: { create: orderItemsData },
      },
    });
  } catch (err) {
    // Two near-simultaneous submissions with the same key can both pass the check above;
    // the loser hits the unique constraint here instead of creating a duplicate order.
    if (opts.idempotencyKey && (err as { code?: string }).code === "P2002") {
      const existing = await db.order.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
      if (existing) return existing;
    }
    throw err;
  }

  await logAudit({
    userId: opts.createdById ?? null,
    action: "ORDER_CREATE",
    entityType: "Order",
    entityId: order.id,
    orderId: order.id,
    after: { channel: opts.channel, total, itemCount: opts.items.length },
  });

  if (opts.complete) {
    return fulfillOrder(order.id, opts.createdById ?? null);
  }

  return order;
}

/** Voids an order with reason. If it was already COMPLETED, reverses stock and ledger entries. */
export async function voidOrder(orderId: string, reason: string, userId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === "VOIDED") return order;

    if (order.status === "COMPLETED") {
      const items = await tx.orderItem.findMany({
        where: { orderId },
        include: { product: { include: { recipe: true } } },
      });
      for (const item of items) {
        for (const ri of item.product.recipe) {
          const restoreQty = ri.quantity * item.qty;
          await tx.ingredient.update({
            where: { id: ri.ingredientId },
            data: { stockQty: { increment: restoreQty } },
          });
          await tx.stockLog.create({
            data: {
              branchId: order.branchId,
              ingredientId: ri.ingredientId,
              type: "ADJUSTMENT",
              quantity: restoreQty,
              reason: `Void reversal: ${reason}`,
              refOrderId: orderId,
              userId,
            },
          });
        }
      }

      const entries = await tx.ledgerEntry.findMany({ where: { orderId } });
      if (entries.length > 0) {
        await tx.ledgerEntry.createMany({
          data: entries.map((e) => ({
            branchId: e.branchId,
            accountId: e.accountId,
            debit: e.credit,
            credit: e.debit,
            refType: "ORDER" as const,
            orderId,
            description: `Void reversal: ${e.description ?? ""}`,
          })),
        });
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "VOIDED", voidReason: reason },
    });

    await tx.auditLog.create({
      data: { userId, action: "VOID_ORDER", entityType: "Order", entityId: orderId, reason, orderId },
    });

    return updated;
  }, TX_OPTIONS);
}
