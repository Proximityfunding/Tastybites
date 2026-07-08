import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const VARIANTS = {
  orange: { bg: "bg-orange-50", ring: "ring-orange-100", icon: "bg-orange-500", text: "text-orange-700" },
  green: { bg: "bg-emerald-50", ring: "ring-emerald-100", icon: "bg-emerald-500", text: "text-emerald-700" },
  blue: { bg: "bg-sky-50", ring: "ring-sky-100", icon: "bg-sky-500", text: "text-sky-700" },
  purple: { bg: "bg-violet-50", ring: "ring-violet-100", icon: "bg-violet-500", text: "text-violet-700" },
  amber: { bg: "bg-amber-50", ring: "ring-amber-100", icon: "bg-amber-500", text: "text-amber-700" },
  red: { bg: "bg-rose-50", ring: "ring-rose-100", icon: "bg-rose-500", text: "text-rose-700" },
  gray: { bg: "bg-gray-50", ring: "ring-gray-200", icon: "bg-gray-500", text: "text-gray-700" },
} as const;

export type StatCardColor = keyof typeof VARIANTS;

export default function StatCard({
  label,
  value,
  href,
  color = "orange",
  icon: Icon,
}: {
  label: string;
  value: string;
  href?: string;
  color?: StatCardColor;
  icon?: LucideIcon;
}) {
  const v = VARIANTS[color];
  const content = (
    <div className={`rounded-xl border-0 p-4 ring-1 ${v.bg} ${v.ring} transition hover:-translate-y-0.5 hover:shadow-sm`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${v.icon}`}>
            <Icon size={18} className="text-white" />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-gray-500">{label}</div>
          <div className={`mt-0.5 text-xl font-bold ${v.text}`}>{value}</div>
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
