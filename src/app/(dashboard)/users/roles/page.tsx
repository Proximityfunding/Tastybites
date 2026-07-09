import Link from "next/link";
import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";
import { PERMISSIONS, DEFAULT_GRANTS, EDITABLE_ROLES } from "@/lib/permissions";
import { updateRolePermissions } from "./actions";

const ROLE_LABELS: Record<(typeof EDITABLE_ROLES)[number], string> = {
  CASHIER_STAFF: "Cashier / Staff",
  KITCHEN: "Kitchen",
};

export default async function RoleManagementPage() {
  await requirePageRole("OWNER_ADMIN");

  const rows = await db.rolePermission.findMany();
  const grantMap = new Map(rows.map((r) => [`${r.role}:${r.permission}`, r.allowed]));

  function isAllowed(role: (typeof EDITABLE_ROLES)[number], key: string) {
    const stored = grantMap.get(`${role}:${key}`);
    return stored ?? DEFAULT_GRANTS[key as keyof typeof DEFAULT_GRANTS].includes(role);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Role Management</h1>
        <Link href="/users" className="text-sm text-orange-600 hover:underline">
          ← Back to Users
        </Link>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-gray-500">
        Choose which pages each role can access. Owner/Admin always has full access and isn&apos;t shown here.
        Users, Audit Trail, voiding an order, and this screen itself always stay Owner-only, regardless of what&apos;s
        set below — this keeps a misconfiguration from ever locking you out.
      </p>

      <form action={updateRolePermissions}>
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-3 pl-4 pr-4">Page</th>
                {EDITABLE_ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 text-center">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.key} className="border-b border-gray-100">
                  <td className="py-3 pl-4 pr-4">
                    <div className="font-medium text-gray-900">{p.label}</div>
                    <div className="text-xs text-gray-400">{p.description}</div>
                  </td>
                  {EDITABLE_ROLES.map((role) => (
                    <td key={role} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        name={`${role}:${p.key}`}
                        defaultChecked={isAllowed(role, p.key)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          className="mt-4 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
