import type { Role } from "@prisma/client";

/**
 * One entry per togglable area of the app. Keys are stored in RolePermission.permission
 * and must stay stable — renaming one silently orphans existing grants in the DB.
 *
 * Deliberately NOT included here (always hardcoded OWNER_ADMIN-only, see src/lib/access.ts):
 * Users, Audit Trail, voiding an order, and the Role Management screen itself.
 */
export const PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", description: "View the dashboard overview and stats." },
  { key: "pos", label: "POS", description: "Use the point-of-sale register to ring up sales." },
  { key: "orders", label: "Orders", description: "View the order list, order details, and quick order entry." },
  { key: "kitchen", label: "Kitchen Display", description: "Use the kitchen order board to manage order status." },
  { key: "inventory", label: "Inventory", description: "View ingredient stock levels. Adjusting stock stays owner-only." },
  { key: "products", label: "Products", description: "Manage the product catalog and categories." },
  { key: "suppliers", label: "Suppliers", description: "Manage supplier records." },
  { key: "deliveries", label: "Deliveries", description: "Assign and manage delivery orders." },
  { key: "expenses", label: "Expenses", description: "Record and view store expenses." },
  { key: "reports", label: "Reports", description: "View sales reports." },
  { key: "pnl", label: "P&L", description: "View profit & loss statements." },
  { key: "customers", label: "Customers", description: "View and manage customer records." },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

/** Defaults mirror the hardcoded role checks this system replaces, so migrating in changes nothing until edited. */
export const DEFAULT_GRANTS: Record<PermissionKey, Role[]> = {
  dashboard: ["OWNER_ADMIN", "CASHIER_STAFF", "KITCHEN"],
  pos: ["OWNER_ADMIN", "CASHIER_STAFF"],
  orders: ["OWNER_ADMIN", "CASHIER_STAFF"],
  kitchen: ["OWNER_ADMIN", "CASHIER_STAFF", "KITCHEN"],
  inventory: ["OWNER_ADMIN", "CASHIER_STAFF"],
  products: ["OWNER_ADMIN"],
  suppliers: ["OWNER_ADMIN"],
  deliveries: ["OWNER_ADMIN", "CASHIER_STAFF"],
  expenses: ["OWNER_ADMIN"],
  reports: ["OWNER_ADMIN"],
  pnl: ["OWNER_ADMIN"],
  customers: ["OWNER_ADMIN", "CASHIER_STAFF"],
};

export const EDITABLE_ROLES = ["CASHIER_STAFF", "KITCHEN"] as const satisfies Role[];
