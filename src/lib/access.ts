import "server-only";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "./db";
import { PERMISSIONS, DEFAULT_GRANTS, type PermissionKey } from "./permissions";

export class AccessError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AccessError";
  }
}

/** Throws if there's no session, or the session's role isn't in `roles`. */
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) throw new AccessError("Not signed in");
  if (roles.length > 0 && !roles.includes(session.user.role)) {
    throw new AccessError(`Requires role: ${roles.join(", ")}`);
  }
  return session.user;
}

/** Throws if there's no session. Any authenticated staff role is allowed. */
export async function requireStaff() {
  return requireRole("OWNER_ADMIN", "CASHIER_STAFF", "KITCHEN");
}

/** For page components: redirects instead of throwing, so unauthorized views never render. */
export async function requirePageRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (roles.length > 0 && !roles.includes(session.user.role)) redirect("/unauthorized");
  return session.user;
}

/** OWNER_ADMIN always has every permission, regardless of what's stored — a deliberate safety rail. */
export async function hasPermission(role: Role, permission: PermissionKey) {
  if (role === "OWNER_ADMIN") return true;
  const row = await db.rolePermission.findUnique({ where: { role_permission: { role, permission } } });
  if (row) return row.allowed;
  return DEFAULT_GRANTS[permission].includes(role);
}

/** For server actions: throws if the signed-in user's role lacks `permission`. */
export async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user) throw new AccessError("Not signed in");
  if (!(await hasPermission(session.user.role, permission))) {
    throw new AccessError(`Requires permission: ${permission}`);
  }
  return session.user;
}

/** For page components: redirects instead of throwing, so unauthorized views never render. */
export async function requirePagePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!(await hasPermission(session.user.role, permission))) redirect("/unauthorized");
  return session.user;
}

/** All permission keys currently granted to `role` — used to drive Sidebar visibility. */
export async function getAllowedPermissions(role: Role): Promise<PermissionKey[]> {
  if (role === "OWNER_ADMIN") return PERMISSIONS.map((p) => p.key);
  const rows = await db.rolePermission.findMany({ where: { role } });
  const overrides = new Map(rows.map((r) => [r.permission, r.allowed]));
  return PERMISSIONS.filter((p) => overrides.get(p.key) ?? DEFAULT_GRANTS[p.key].includes(role)).map(
    (p) => p.key
  );
}
