export type PeriodKey = "today" | "week" | "month" | "year" | "custom";

export function resolvePeriod(searchParams: { period?: string; from?: string; to?: string }) {
  const period = (searchParams.period as PeriodKey) || "month";
  const now = new Date();
  let from: Date;
  let to: Date;

  if (period === "custom" && searchParams.from && searchParams.to) {
    from = new Date(searchParams.from);
    to = new Date(searchParams.to);
    to.setHours(23, 59, 59, 999);
  } else if (period === "today") {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
    to = now;
  } else if (period === "year") {
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { period, from, to };
}
