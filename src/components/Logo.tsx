import { Sandwich } from "lucide-react";

const SIZES = {
  sm: { badge: "h-8 w-8", icon: 16, text: "text-lg", tagline: "hidden" },
  md: { badge: "h-10 w-10", icon: 20, text: "text-xl", tagline: "text-[10px]" },
  lg: { badge: "h-14 w-14", icon: 28, text: "text-3xl", tagline: "text-xs" },
} as const;

export default function Logo({ size = "md", withTagline = true }: { size?: keyof typeof SIZES; withTagline?: boolean }) {
  const s = SIZES[size];
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${s.badge} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-sm`}
      >
        <Sandwich size={s.icon} className="text-white" strokeWidth={2.25} />
      </div>
      <div className="leading-tight">
        <div className={`${s.text} font-extrabold tracking-tight text-red-700`}>
          Tasty<span className="text-orange-500">Bites</span>
        </div>
        {withTagline && (
          <div className={`${s.tagline} font-semibold uppercase tracking-widest text-gray-400`}>
            Snacks &amp; Drinks
          </div>
        )}
      </div>
    </div>
  );
}
