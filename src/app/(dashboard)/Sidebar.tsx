import Link from "next/link";
import type { Role } from "@prisma/client";
import Logo from "@/components/Logo";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Boxes,
  UtensilsCrossed,
  Truck,
  Receipt,
  BarChart3,
  Users,
  Contact,
  UserCog,
  History,
  ChefHat,
} from "lucide-react";

const ICON_COLOR = {
  orange: "text-orange-500",
  green: "text-emerald-500",
  blue: "text-sky-500",
  purple: "text-violet-500",
  amber: "text-amber-500",
  red: "text-rose-500",
  gray: "text-gray-400",
} as const;

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "orange",
    roles: ["OWNER_ADMIN", "CASHIER_STAFF", "KITCHEN"],
  },
  { href: "/pos", label: "POS", icon: ShoppingCart, color: "green", roles: ["OWNER_ADMIN", "CASHIER_STAFF"] },
  {
    href: "/orders",
    label: "Orders",
    icon: ClipboardList,
    color: "blue",
    roles: ["OWNER_ADMIN", "CASHIER_STAFF"],
  },
  {
    href: "/kitchen",
    label: "Kitchen Display",
    icon: ChefHat,
    color: "red",
    roles: ["OWNER_ADMIN", "CASHIER_STAFF", "KITCHEN"],
  },
  { href: "/inventory", label: "Inventory", icon: Boxes, color: "amber", roles: ["OWNER_ADMIN", "CASHIER_STAFF"] },
  { href: "/products", label: "Products", icon: UtensilsCrossed, color: "purple", roles: ["OWNER_ADMIN"] },
  { href: "/suppliers", label: "Suppliers", icon: Truck, color: "gray", roles: ["OWNER_ADMIN"] },
  { href: "/deliveries", label: "Deliveries", icon: Truck, color: "blue", roles: ["OWNER_ADMIN", "CASHIER_STAFF"] },
  { href: "/expenses", label: "Expenses", icon: Receipt, color: "red", roles: ["OWNER_ADMIN"] },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "purple", roles: ["OWNER_ADMIN"] },
  { href: "/pnl", label: "P&L", icon: BarChart3, color: "green", roles: ["OWNER_ADMIN"] },
  {
    href: "/customers",
    label: "Customers",
    icon: Contact,
    color: "orange",
    roles: ["OWNER_ADMIN", "CASHIER_STAFF"],
  },
  { href: "/users", label: "Users", icon: UserCog, color: "gray", roles: ["OWNER_ADMIN"] },
  { href: "/audit", label: "Audit Trail", icon: History, color: "gray", roles: ["OWNER_ADMIN"] },
] as const;

export default function Sidebar({ role }: { role: Role }) {
  const items = NAV.filter((item) => (item.roles as readonly string[]).includes(role));

  return (
    <nav className="flex h-full w-56 flex-col gap-1 border-r border-gray-200 bg-white p-3">
      <div className="mb-4 px-2">
        <Logo size="sm" withTagline={false} />
      </div>
      {items.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700"
        >
          <Icon size={16} className={ICON_COLOR[color]} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
