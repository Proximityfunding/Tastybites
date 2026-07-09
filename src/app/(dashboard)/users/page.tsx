import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/access";
import { deleteUser } from "./actions";

export default async function UsersPage() {
  const user = await requirePageRole("OWNER_ADMIN");
  const users = await db.user.findMany({
    where: { branchId: user.branchId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <div className="flex gap-3">
          <Link
            href="/users/roles"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Manage Roles
          </Link>
          <Link
            href="/users/new"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Add User
          </Link>
        </div>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium text-gray-900">{u.name}</td>
              <td className="py-2 pr-4 text-gray-600">{u.email}</td>
              <td className="py-2 pr-4 text-gray-600">{u.role}</td>
              <td className="py-2 pr-4 space-x-3">
                <Link href={`/users/${u.id}/edit`} className="text-orange-600 hover:underline">
                  Edit
                </Link>
                {u.id !== user.id && (
                  <form action={deleteUser.bind(null, u.id)} className="inline">
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
