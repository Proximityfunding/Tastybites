import Link from "next/link";
import { db } from "@/lib/db";
import { getDefaultBranch } from "@/lib/branch";
import Logo from "@/components/Logo";
import ShopClient from "./ShopClient";
import CartHeaderLink from "./CartHeaderLink";

export default async function ShopPage() {
  const branch = await getDefaultBranch();
  const products = await db.product.findMany({
    where: { branchId: branch.id, isActive: true, isAvailable: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { category: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-orange-50/40">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/track" className="text-sm font-medium text-gray-500 hover:text-orange-600">
              Track Order
            </Link>
            <CartHeaderLink />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Our Menu</h1>
        <ShopClient products={products.map((p) => ({ ...p, category: p.category.name }))} />
      </div>
    </div>
  );
}
