"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { formatCentavos } from "@/lib/money";

export default function CartPageClient() {
  const { lines, updateQty, removeItem, updateModifiers } = useCartStore();

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {lines.map((line) => (
          <div
            key={line.productId}
            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900">{line.name}</div>
              <div className="text-sm text-orange-600">{formatCentavos(line.unitPrice)}</div>
              <input
                type="text"
                placeholder="Add a note (e.g. less sugar, no onions)"
                value={line.modifiers}
                onChange={(e) => updateModifiers(line.productId, e.target.value)}
                className="mt-2 w-full max-w-xs rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(line.productId, line.qty - 1)}
                aria-label="Decrease quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-orange-400 hover:text-orange-600"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
              <button
                onClick={() => updateQty(line.productId, line.qty + 1)}
                aria-label="Increase quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-orange-400 hover:text-orange-600"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="w-20 shrink-0 text-right text-sm font-bold text-gray-900">
              {formatCentavos(line.unitPrice * line.qty)}
            </div>

            <button
              onClick={() => removeItem(line.productId)}
              aria-label={`Remove ${line.name}`}
              className="shrink-0 text-gray-400 transition hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>{formatCentavos(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Link href="/shop" className="text-sm font-medium text-orange-600 hover:underline">
          ← Continue Shopping
        </Link>
        <Link
          href="/shop/checkout"
          className="rounded-full bg-orange-600 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-700"
        >
          Proceed to Checkout →
        </Link>
      </div>
    </div>
  );
}
