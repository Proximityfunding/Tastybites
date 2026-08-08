import { manilaDayStart, manilaDayEnd, manilaMonthRange, manilaYearRange, manilaDateFromInput } from "./timezone";

export type PeriodKey = "today" | "week" | "month" | "year" | "custom";

export function resolvePeriod(searchParams: { period?: string; from?: string; to?: string }) {
  const period = (searchParams.period as PeriodKey) || "month";
  const now = new Date();
  let from: Date;
  let to: Date;

  if (period === "custom" && searchParams.from && searchParams.to) {
    from = manilaDayStart(manilaDateFromInput(searchParams.from));
    to = manilaDayEnd(manilaDateFromInput(searchParams.to));
  } else if (period === "today") {
    from = manilaDayStart(now);
    to = manilaDayEnd(now);
  } else if (period === "week") {
    from = manilaDayStart(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    to = manilaDayEnd(now);
  } else if (period === "year") {
    ({ from, to } = manilaYearRange(now));
  } else {
    ({ from, to } = manilaMonthRange(now));
  }

  return { period, from, to };
}
