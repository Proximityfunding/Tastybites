import "server-only";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";

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
