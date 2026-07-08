import "server-only";
import { db } from "./db";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getPeakHoursHeatmap(branchId: string, sinceDays = 30) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const orders = await db.order.findMany({
    where: { branchId, status: "COMPLETED", createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const o of orders) {
    grid[o.createdAt.getDay()][o.createdAt.getHours()]++;
  }
  const max = Math.max(1, ...grid.flat());
  return { grid, max, dayNames: DAY_NAMES };
}

export async function getBestSellers(branchId: string, sinceDays = 30, limit = 5) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const items = await db.orderItem.findMany({
    where: { order: { branchId, status: "COMPLETED", createdAt: { gte: since } } },
    include: { product: true },
  });

  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of items) {
    const entry = byProduct.get(item.productId) || { name: item.product.name, qty: 0, revenue: 0 };
    entry.qty += item.qty;
    entry.revenue += item.lineTotal;
    byProduct.set(item.productId, entry);
  }

  const all = Array.from(byProduct.values());
  return {
    byQty: [...all].sort((a, b) => b.qty - a.qty).slice(0, limit),
    byRevenue: [...all].sort((a, b) => b.revenue - a.revenue).slice(0, limit),
  };
}

export async function getCustomerInsights(branchId: string, sinceDays = 30) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const orders = await db.order.findMany({
    where: { branchId, status: "COMPLETED", createdAt: { gte: since } },
    select: { customerId: true, total: true },
  });

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const aov = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const ordersByCustomer = new Map<string, number>();
  for (const o of orders) {
    if (!o.customerId) continue;
    ordersByCustomer.set(o.customerId, (ordersByCustomer.get(o.customerId) || 0) + 1);
  }
  const totalCustomers = ordersByCustomer.size;
  const repeatCustomers = Array.from(ordersByCustomer.values()).filter((c) => c > 1).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  return { aov, repeatRate, totalCustomers, orderCount: orders.length };
}
