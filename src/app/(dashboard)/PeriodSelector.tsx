import Link from "next/link";
import type { PeriodKey } from "@/lib/period";

const OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

export default function PeriodSelector({ basePath, current }: { basePath: string; current: string }) {
  return (
    <div className="mb-4 flex gap-4 text-sm">
      {OPTIONS.map((o) => (
        <Link
          key={o.key}
          href={`${basePath}?period=${o.key}`}
          className={current === o.key ? "font-semibold text-orange-600" : "text-gray-500 hover:text-gray-800"}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
