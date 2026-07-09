"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/access";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, EDITABLE_ROLES } from "@/lib/permissions";
import type { Role } from "@prisma/client";

/** Owner-only, and deliberately not itself governed by the dynamic permission table. */
export async function updateRolePermissions(formData: FormData) {
  const admin = await requireRole("OWNER_ADMIN");

  const changes: { role: Role; permission: string; allowed: boolean }[] = [];
  for (const role of EDITABLE_ROLES) {
    for (const { key } of PERMISSIONS) {
      const allowed = formData.get(`${role}:${key}`) === "on";
      changes.push({ role, permission: key, allowed });
    }
  }

  await db.$transaction(
    changes.map((c) =>
      db.rolePermission.upsert({
        where: { role_permission: { role: c.role, permission: c.permission } },
        update: { allowed: c.allowed },
        create: c,
      })
    )
  );

  await logAudit({
    userId: admin.id,
    action: "ROLE_PERMISSIONS_UPDATE",
    entityType: "RolePermission",
    entityId: "matrix",
    after: { changes },
  });

  revalidatePath("/users/roles");
}
