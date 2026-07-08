"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import type { Role } from "@prisma/client";

export async function createUser(formData: FormData) {
  const admin = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as Role;

  if (!name || !email || password.length < 8 || !role) {
    throw new Error("Name, email, role, and an 8+ character password are required");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: { branchId: admin.branchId, name, email, passwordHash, role },
  });

  await logAudit({
    userId: admin.id,
    action: "USER_CREATE",
    entityType: "User",
    entityId: user.id,
    after: { name: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(id: string, formData: FormData) {
  const admin = await requireRole("OWNER_ADMIN");
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "") as Role;
  const password = String(formData.get("password") || "");
  if (!name || !role) throw new Error("Name and role are required");

  const before = await db.user.findUniqueOrThrow({ where: { id } });
  const passwordChanged = password.length > 0;

  await db.user.update({
    where: { id },
    data: {
      name,
      role,
      ...(passwordChanged ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  await logAudit({
    userId: admin.id,
    action: "USER_UPDATE",
    entityType: "User",
    entityId: id,
    before: { name: before.name, role: before.role },
    after: { name, role, passwordChanged },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function deleteUser(id: string) {
  const admin = await requireRole("OWNER_ADMIN");
  if (admin.id === id) throw new Error("You cannot delete your own account");

  const user = await db.user.delete({ where: { id } });

  await logAudit({
    userId: admin.id,
    action: "USER_DELETE",
    entityType: "User",
    entityId: id,
    before: { name: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/users");
}
