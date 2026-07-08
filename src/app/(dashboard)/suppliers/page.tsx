import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/access";
import { deleteSupplier } from "./actions";

export default async function SuppliersPage() {
  const user = await requirePageRole("OWNER_ADMIN");
  const suppliers = await db.supplier.findMany({
    where: { branchId: user.branchId },
    orderBy: { name: "asc" },
    include: { _count: { select: { ingredients: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
        <Link
          href="/suppliers/new"
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Add Supplier
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Contact</th>
            <th className="py-2 pr-4">Phone</th>
            <th className="py-2 pr-4">Ingredients Supplied</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium text-gray-900">
                <Link href={`/suppliers/${s.id}`} className="hover:underline">
                  {s.name}
                </Link>
              </td>
              <td className="py-2 pr-4 text-gray-600">{s.contactName || "—"}</td>
              <td className="py-2 pr-4 text-gray-600">{s.phone || "—"}</td>
              <td className="py-2 pr-4 text-gray-600">{s._count.ingredients}</td>
              <td className="py-2 pr-4">
                <form action={deleteSupplier.bind(null, s.id)}>
                  <button type="submit" className="text-red-600 hover:underline">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {suppliers.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-400">
                No suppliers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
