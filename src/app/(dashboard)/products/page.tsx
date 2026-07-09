import Link from "next/link";
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/access";
import { formatCentavos } from "@/lib/money";
import { deleteProduct } from "./actions";

type SortField = "name" | "category" | "cost" | "price" | "margin" | "status";

const SORT_LABELS: Record<SortField, string> = {
  name: "Name",
  category: "Category",
  cost: "Cost",
  price: "SRP",
  margin: "Margin",
  status: "Status",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; sort?: string; dir?: string }>;
}) {
  const user = await requirePagePermission("products");
  const { q, categoryId, sort, dir } = await searchParams;
  const sortField: SortField = (["name", "category", "cost", "price", "margin", "status"] as const).includes(
    sort as SortField
  )
    ? (sort as SortField)
    : "category";
  const sortDir: "asc" | "desc" = dir === "desc" ? "desc" : "asc";

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        branchId: user.branchId,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
    }),
    db.category.findMany({
      where: { branchId: user.branchId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const rows = products
    .map((p) => {
      const margin = p.price - p.cost;
      const marginPct = p.price > 0 ? Math.round((margin / p.price) * 100) : 0;
      const status = !p.isActive ? "Inactive" : p.isAvailable ? "Available" : "Unavailable";
      return { ...p, margin, marginPct, status };
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "category":
          cmp = a.category.sortOrder - b.category.sortOrder || a.category.name.localeCompare(b.category.name);
          break;
        case "cost":
          cmp = a.cost - b.cost;
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "margin":
          cmp = a.margin - b.margin;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });

  function sortHref(field: SortField) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("sort", field);
    params.set("dir", sortField === field && sortDir === "asc" ? "desc" : "asc");
    return `/products?${params.toString()}`;
  }

  function categoryHref(id: string | null) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (id) params.set("categoryId", id);
    if (sort) params.set("sort", sort);
    if (dir) params.set("dir", dir);
    return `/products?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <div className="flex gap-3">
          <Link
            href="/products/categories"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Manage Categories
          </Link>
          <Link
            href="/products/new"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Add Product
          </Link>
        </div>
      </div>

      <form className="relative mb-4 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none"
        />
        {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
        {sort && <input type="hidden" name="sort" value={sort} />}
        {dir && <input type="hidden" name="dir" value={dir} />}
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={categoryHref(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            !categoryId
              ? "bg-orange-600 text-white"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-orange-300"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={categoryHref(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              categoryId === c.id
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-orange-300"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
              <th key={field} className="py-2 pr-4">
                <Link href={sortHref(field)} className="flex items-center gap-1 hover:text-gray-900">
                  {SORT_LABELS[field]}
                  {sortField === field ? (
                    sortDir === "asc" ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-gray-300" />
                  )}
                </Link>
              </th>
            ))}
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className={`border-b border-gray-100 ${!p.isActive ? "opacity-50" : ""}`}>
              <td className="py-2 pr-4 font-medium text-gray-900">{p.name}</td>
              <td className="py-2 pr-4 text-gray-600">{p.category.name}</td>
              <td className="py-2 pr-4 text-gray-600">{formatCentavos(p.cost)}</td>
              <td className="py-2 pr-4 text-gray-600">{formatCentavos(p.price)}</td>
              <td className="py-2 pr-4 text-gray-600">
                {formatCentavos(p.margin)} <span className="text-xs text-gray-400">({p.marginPct}%)</span>
              </td>
              <td className="py-2 pr-4 text-gray-600">{p.status}</td>
              <td className="py-2 pr-4 space-x-3">
                <Link href={`/products/${p.id}/edit`} className="text-orange-600 hover:underline">
                  Edit
                </Link>
                {p.isActive && (
                  <form action={deleteProduct.bind(null, p.id)} className="inline">
                    <button type="submit" className="text-red-600 hover:underline">
                      Deactivate
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-center text-gray-400">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
