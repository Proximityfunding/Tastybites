"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart";
import { formatCentavos } from "@/lib/money";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
};

export default function ShopClient({ products }: { products: Product[] }) {
  const { lines, addItem } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return Array.from(map.entries());
  }, [products]);

  const visibleCategories = activeCategory ? categories.filter(([c]) => c === activeCategory) : categories;

  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  return (
    <div className="pb-24">
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            activeCategory === null
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-orange-300"
          }`}
        >
          All
        </button>
        {categories.map(([category]) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeCategory === category
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-orange-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {visibleCategories.map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-gray-900">{category}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 shrink-0 rounded-lg bg-orange-50" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900">{p.name}</div>
                  {p.description && <div className="line-clamp-2 text-sm text-gray-500">{p.description}</div>}
                  <div className="mt-1 text-sm font-bold text-orange-600">{formatCentavos(p.price)}</div>
                </div>
                <button
                  onClick={() => addItem({ id: p.id, name: p.name, price: p.price })}
                  className="shrink-0 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 active:scale-95"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {itemCount} item{itemCount > 1 ? "s" : ""} · {formatCentavos(total)}
            </span>
            <Link
              href="/shop/cart"
              className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              View Cart →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
