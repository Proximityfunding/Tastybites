import Link from "next/link";
import type { PeriodKey } from "@/lib/period";

const OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PeriodSelector({
  basePath,
  current,
  from,
  to,
}: {
  basePath: string;
  current: string;
  /** Currently active range, used to prefill the custom date inputs even when a preset is selected. */
  from: Date;
  to: Date;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
      {OPTIONS.map((o) => (
        <Link
          key={o.key}
          href={`${basePath}?period=${o.key}`}
          className={current === o.key ? "font-semibold text-orange-600" : "text-gray-500 hover:text-gray-800"}
        >
          {o.label}
        </Link>
      ))}

      <form action={basePath} method="get" className="flex items-center gap-2">
        <span className={current === "custom" ? "font-semibold text-orange-600" : "text-gray-500"}>
          Custom:
        </span>
        <input type="hidden" name="period" value="custom" />
        <label className="sr-only" htmlFor={`${basePath}-from`}>
          From date
        </label>
        <input
          id={`${basePath}-from`}
          type="date"
          name="from"
          defaultValue={toDateInputValue(from)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
        />
        <span className="text-gray-400">to</span>
        <label className="sr-only" htmlFor={`${basePath}-to`}>
          To date
        </label>
        <input
          id={`${basePath}-to`}
          type="date"
          name="to"
          defaultValue={toDateInputValue(to)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
        />
        <button
          type="submit"
          className="rounded-md bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-700"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
