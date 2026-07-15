import Link from "next/link";
import type { Role } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions";
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
  Settings,
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

/**
 * `permission` items are governed by the dynamic Role Management matrix (src/lib/permissions.ts).
 * `roles` items (Users, Audit Trail) are always hardcoded OWNER_ADMIN-only — a safety rail so a
 * misconfigured matrix can never hide the screen that fixes the matrix.
 */
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "orange", permission: "dashboard" },
  { href: "/pos", label: "POS", icon: ShoppingCart, color: "green", permission: "pos" },
  { href: "/orders", label: "Orders", icon: ClipboardList, color: "blue", permission: "orders" },
  { href: "/kitchen", label: "Kitchen Display", icon: ChefHat, color: "red", permission: "kitchen" },
  { href: "/inventory", label: "Inventory", icon: Boxes, color: "amber", permission: "inventory" },
  { href: "/products", label: "Products", icon: UtensilsCrossed, color: "purple", permission: "products" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, color: "gray", permission: "suppliers" },
  { href: "/deliveries", label: "Deliveries", icon: Truck, color: "blue", permission: "deliveries" },
  { href: "/expenses", label: "Expenses", icon: Receipt, color: "red", permission: "expenses" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "purple", permission: "reports" },
  { href: "/pnl", label: "P&L", icon: BarChart3, color: "green", permission: "pnl" },
  { href: "/customers", label: "Customers", icon: Contact, color: "orange", permission: "customers" },
  { href: "/users", label: "Users", icon: UserCog, color: "gray", roles: ["OWNER_ADMIN"] },
  { href: "/audit", label: "Audit Trail", icon: History, color: "gray", roles: ["OWNER_ADMIN"] },
  { href: "/settings", label: "Store Settings", icon: Settings, color: "gray", roles: ["OWNER_ADMIN"] },
] as const;

export default function Sidebar({ role, allowedPermissions }: { role: Role; allowedPermissions: PermissionKey[] }) {
  const allowedSet = new Set<string>(allowedPermissions);
  const items = NAV.filter((item) =>
    "permission" in item ? allowedSet.has(item.permission) : (item.roles as readonly string[]).includes(role)
  );

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
