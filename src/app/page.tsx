import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getDefaultBranch } from "@/lib/branch";
import { formatCentavos } from "@/lib/money";
import Logo from "@/components/Logo";
import BannerSlider from "./BannerSlider";

export default async function LandingPage() {
  const branch = await getDefaultBranch();
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { branchId: branch.id, isActive: true, isAvailable: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { category: { name: "asc" } }, { name: "asc" }],
      take: 6,
    }),
    db.category.findMany({
      where: { branchId: branch.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="min-h-screen bg-orange-50/40">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/track" className="hidden text-gray-500 hover:text-orange-600 sm:inline">
              Track Order
            </Link>
            <Link href="/login" className="hidden text-gray-500 hover:text-orange-600 sm:inline">
              Staff Login
            </Link>
            <Link
              href="/shop"
              className="rounded-full bg-orange-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Order Now
            </Link>
          </nav>
        </div>
      </header>

      <BannerSlider />

      {categories.length > 0 && (
        <section className="border-b border-orange-100 bg-white py-4">
          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3 px-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href="/shop"
                className="rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-14 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Burgers, Shomai, Halo-Halo &amp; More
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Order online for pickup or delivery, or visit us in-store at {branch.address}.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-orange-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-orange-700"
        >
          View Full Menu
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Popular Picks</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href="/shop"
              className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-32 w-full bg-orange-50 sm:h-36">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                <div className="text-sm font-bold text-orange-600">{formatCentavos(p.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-orange-600 to-red-600 py-12 text-center text-white">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Craving Something Tasty?</h2>
        <p className="mt-2 text-white/90">Order online now — pickup or delivery, your choice.</p>
        <Link
          href="/shop"
          className="mt-5 inline-block rounded-full bg-white px-8 py-3 font-bold text-orange-700 shadow-md transition hover:bg-orange-50"
        >
          Order Now →
        </Link>
      </section>

      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
        <div className="mb-2 flex justify-center">
          <Logo size="sm" />
        </div>
        <div className="mx-auto mt-3 flex w-fit flex-col items-center gap-1">
          <span>{branch.address}</span>
          <span>{branch.phone}</span>
        </div>
      </footer>
    </div>
  );
}
