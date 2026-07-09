import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/access";
import { formatCentavos } from "@/lib/money";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePagePermission("customers");
  const session = await auth();
  const { q } = await searchParams;

  const customers = await db.customer.findMany({
    where: {
      branchId: session!.user.branchId,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { lastOrderAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <Link
          href="/customers/new"
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Add Customer
        </Link>
      </div>

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or phone…"
          className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Phone</th>
            <th className="py-2 pr-4">Tags</th>
            <th className="py-2 pr-4">Total Spend</th>
            <th className="py-2 pr-4">Last Order</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium text-gray-900">
                <Link href={`/customers/${c.id}`} className="hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="py-2 pr-4 text-gray-600">{c.phone || "—"}</td>
              <td className="py-2 pr-4 text-gray-600">{c.tags.join(", ") || "—"}</td>
              <td className="py-2 pr-4 text-gray-600">{formatCentavos(c.totalSpend)}</td>
              <td className="py-2 pr-4 text-gray-600">{c.lastOrderAt?.toLocaleDateString() || "—"}</td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-400">
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
