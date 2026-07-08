"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart";
import { formatCentavos } from "@/lib/money";
import { submitCheckout } from "./actions";

export default function CheckoutForm() {
  const { lines } = useCartStore();
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  if (lines.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link href="/shop" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline">
          ← Back to menu
        </Link>
      </div>
    );
  }

  const items = JSON.stringify(
    lines.map((l) => ({ productId: l.productId, qty: l.qty, modifiers: l.modifiers || null }))
  );

  return (
    <div>
      <div className="mb-6 rounded-md border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order Summary</span>
          <Link href="/shop/cart" className="text-xs font-medium text-orange-600 hover:underline">
            Edit Cart
          </Link>
        </div>
        {lines.map((l) => (
          <div key={l.productId} className="flex justify-between py-1 text-sm">
            <span>
              {l.qty}× {l.name}
            </span>
            <span>{formatCentavos(l.unitPrice * l.qty)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatCentavos(total)}</span>
        </div>
      </div>

      <form action={submitCheckout} className="space-y-4">
        <input type="hidden" name="items" value={items} />
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            name="phone"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fulfillment</label>
          <div className="mt-1 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fulfillment"
                value="pickup"
                checked={fulfillment === "pickup"}
                onChange={() => setFulfillment("pickup")}
              />
              Pickup
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fulfillment"
                value="delivery"
                checked={fulfillment === "delivery"}
                onChange={() => setFulfillment("delivery")}
              />
              Delivery (Lalamove)
            </label>
          </div>
        </div>
        {fulfillment === "delivery" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
            <input
              name="address"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <input name="notes" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <p className="text-xs text-gray-500">
          Payment is collected on {fulfillment === "pickup" ? "pickup" : "delivery"} (cash, GCash, or card).
        </p>
        <button
          type="submit"
          className="w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Place Order
        </button>
      </form>
    </div>
  );
}
