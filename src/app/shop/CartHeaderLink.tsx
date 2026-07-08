"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart";

export default function CartHeaderLink() {
  const lines = useCartStore((s) => s.lines);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <Link href="/shop/cart" className="relative text-gray-500 hover:text-orange-600" aria-label="View cart">
      <ShoppingCart size={20} />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
