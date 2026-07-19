import "server-only";
import { db } from "./db";
import { formatCentavos } from "./money";
import type { OrderStatus } from "@prisma/client";

/**
 * Customer-facing copy per status. Statuses not listed here (e.g. PENDING) don't notify.
 * Only ONLINE-channel orders notify at all — walk-in/dine-in customers are standing at the counter.
 */
const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; headline: string; body: string }>> = {
  CONFIRMED: {
    subject: "Your order is confirmed",
    headline: "Order confirmed ✓",
    body: "We've received your order and will start preparing it shortly.",
  },
  PREPARING: {
    subject: "Your order is being prepared",
    headline: "Now preparing your order 🍳",
    body: "Our kitchen is working on your order right now.",
  },
  READY: {
    subject: "Your order is ready!",
    headline: "Your order is ready 🎉",
    body: "Your order is ready for pickup. See you soon!",
  },
  OUT_FOR_DELIVERY: {
    subject: "Your order is on the way",
    headline: "Out for delivery 🛵",
    body: "Your order has left the store and is on its way to you.",
  },
  COMPLETED: {
    subject: "Your order is complete — thank you!",
    headline: "Order complete 🧡",
    body: "Thanks for ordering with us. We hope you enjoy your food!",
  },
  CANCELLED: {
    subject: "Your order was cancelled",
    headline: "Order cancelled",
    body: "Your order has been cancelled. If this is unexpected, please contact the store.",
  },
  VOIDED: {
    subject: "Your order was cancelled",
    headline: "Order cancelled",
    body: "Your order has been cancelled. If this is unexpected, please contact the store.",
  },
};

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://store-app-iota-ten.vercel.app";
}

async function logNotification(
  orderId: string,
  recipient: string | null,
  status: "SENT" | "SKIPPED" | "FAILED",
  detail: string
) {
  try {
    await db.notificationLog.create({
      data: { orderId, channel: "EMAIL", recipient, status, detail },
    });
  } catch (e) {
    console.error("[notifications] failed to write NotificationLog:", e);
  }
}

/**
 * Emails the customer about an order status change. Fire-and-safe: every outcome
 * (sent, skipped, failed) is recorded in NotificationLog and errors never propagate
 * to the caller, so a mail problem can't break a status update.
 */
export async function notifyOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const copy = STATUS_COPY[status];
    if (!copy) return;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { customer: true, branch: true, items: { include: { product: true } } },
    });
    if (!order || order.channel !== "ONLINE") return;

    const email = order.customer?.email?.trim();
    if (!email) {
      await logNotification(orderId, null, "SKIPPED", `${status}: customer has no email address`);
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      await logNotification(orderId, email, "SKIPPED", `${status}: RESEND_API_KEY not configured`);
      return;
    }

    const from = process.env.RESEND_FROM || `${order.branch.name} <onboarding@resend.dev>`;
    const orderNo = order.id.slice(-6);
    const trackUrl = `${siteUrl()}/shop/thank-you/${order.id}`;
    const itemsHtml = order.items
      .map((i) => `<tr><td style="padding:2px 12px 2px 0">${i.qty}× ${i.product.name}</td><td align="right">${formatCentavos(i.lineTotal)}</td></tr>`)
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="color:#ea580c;margin-bottom:4px">${order.branch.name}</h2>
        <h3 style="margin:16px 0 4px">${copy.headline}</h3>
        <p style="margin:0 0 12px;color:#444">${copy.body}</p>
        <p style="margin:0 0 16px;color:#666;font-size:14px">Order <strong>#${orderNo}</strong></p>
        <table style="font-size:14px;border-collapse:collapse">${itemsHtml}
          <tr><td style="padding:6px 12px 0 0;border-top:1px solid #ddd"><strong>Total</strong></td><td align="right" style="padding-top:6px;border-top:1px solid #ddd"><strong>${formatCentavos(order.total)}</strong></td></tr>
        </table>
        <p style="margin:20px 0"><a href="${trackUrl}" style="background:#ea580c;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Track your order</a></p>
        <p style="color:#999;font-size:12px">${order.branch.address ?? ""}${order.branch.phone ? " · " + order.branch.phone : ""}</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${copy.subject} — Order #${orderNo}`,
        html,
      }),
    });

    if (res.ok) {
      await logNotification(orderId, email, "SENT", `${status}: email accepted by Resend`);
    } else {
      const errText = (await res.text()).slice(0, 300);
      await logNotification(orderId, email, "FAILED", `${status}: Resend ${res.status} — ${errText}`);
    }
  } catch (e) {
    await logNotification(orderId, null, "FAILED", `${status}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
