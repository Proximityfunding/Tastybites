"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Printer, Plus } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { formatCentavos } from "@/lib/money";
import { submitPOSOrder } from "./actions";
import Receipt from "../orders/Receipt";
import type { Order, OrderItem, Product as ProductModel, Customer } from "@prisma/client";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
  stock: number | null;
};

type CompletedOrder = Order & {
  items: (OrderItem & { product: ProductModel })[];
  customer: Customer | null;
};

const CATEGORY_PALETTE = [
  { bg: "bg-orange-50", border: "border-orange-200", hover: "hover:border-orange-400", text: "text-orange-700", badge: "bg-orange-100 text-orange-700", accent: "bg-orange-500", chip: "bg-orange-600" },
  { bg: "bg-rose-50", border: "border-rose-200", hover: "hover:border-rose-400", text: "text-rose-700", badge: "bg-rose-100 text-rose-700", accent: "bg-rose-500", chip: "bg-rose-600" },
  { bg: "bg-amber-50", border: "border-amber-200", hover: "hover:border-amber-400", text: "text-amber-700", badge: "bg-amber-100 text-amber-800", accent: "bg-amber-500", chip: "bg-amber-600" },
  { bg: "bg-emerald-50", border: "border-emerald-200", hover: "hover:border-emerald-400", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-500", chip: "bg-emerald-600" },
  { bg: "bg-sky-50", border: "border-sky-200", hover: "hover:border-sky-400", text: "text-sky-700", badge: "bg-sky-100 text-sky-700", accent: "bg-sky-500", chip: "bg-sky-600" },
  { bg: "bg-violet-50", border: "border-violet-200", hover: "hover:border-violet-400", text: "text-violet-700", badge: "bg-violet-100 text-violet-700", accent: "bg-violet-500", chip: "bg-violet-600" },
  { bg: "bg-pink-50", border: "border-pink-200", hover: "hover:border-pink-400", text: "text-pink-700", badge: "bg-pink-100 text-pink-700", accent: "bg-pink-500", chip: "bg-pink-600" },
  { bg: "bg-teal-50", border: "border-teal-200", hover: "hover:border-teal-400", text: "text-teal-700", badge: "bg-teal-100 text-teal-700", accent: "bg-teal-500", chip: "bg-teal-600" },
];

function categoryColor(category: string) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

const EMOJI_RULES: [RegExp, string][] = [
  [/burger/i, "🍔"],
  [/rice/i, "🍚"],
  [/chicken/i, "🍗"],
  [/juice|drink|beverage|soda/i, "🥤"],
  [/milk ?tea|tea/i, "🧋"],
  [/coffee/i, "☕"],
  [/halo/i, "🍧"],
  [/shomai|dimsum|dumpling/i, "🥟"],
  [/noodle|pancit/i, "🍜"],
  [/dessert|cake|sweet|pastry/i, "🍰"],
  [/snack|fries|chips/i, "🍟"],
  [/pizza/i, "🍕"],
  [/sandwich/i, "🥪"],
  [/pork|beef|meat|steak/i, "🥩"],
  [/fish|seafood|shrimp/i, "🐟"],
  [/soup/i, "🍲"],
  [/breakfast|egg/i, "🍳"],
  [/silog/i, "🍳"],
];

function categoryEmoji(category: string) {
  for (const [re, emoji] of EMOJI_RULES) if (re.test(category)) return emoji;
  return "🍽️";
}

export default function POSClient({
  products,
  branch,
  defaultChannel = "DINE_IN",
}: {
  products: Product[];
  branch: { name: string; address: string | null; phone: string | null };
  defaultChannel?: "DINE_IN" | "WALK_IN" | "ONLINE";
}) {
  const router = useRouter();
  const { lines, addItem, updateQty, updateModifiers, clear } = useCartStore();
  const [channel, setChannel] = useState<"DINE_IN" | "WALK_IN" | "ONLINE">(defaultChannel);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH" | "CARD">("CASH");
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  /** Cash received from the customer, in centavos. Only used when paymentMethod is CASH. */
  const [amountTendered, setAmountTendered] = useState(0);

  function addItemToCart(product: { id: string; name: string; price: number }) {
    if (completedOrder) setCompletedOrder(null);
    addItem(product);
  }

  const allCategories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  const categories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchesSearch = query === "" || p.name.toLowerCase().includes(query);
      const matchesCategory = activeCategory === null || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return Array.from(map.entries());
  }, [products, search, activeCategory]);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const change = paymentMethod === "CASH" ? amountTendered - total : 0;

  function submit(complete: boolean) {
    setError(null);
    if (lines.length === 0) {
      setError("Cart is empty");
      return;
    }
    if (complete && paymentMethod === "CASH" && amountTendered < total) {
      setError(
        amountTendered === 0
          ? "Enter the amount received from the customer"
          : "Amount received is less than the total"
      );
      return;
    }
    startTransition(async () => {
      try {
        const order = await submitPOSOrder({
          channel,
          items: lines.map((l) => ({ productId: l.productId, qty: l.qty, modifiers: l.modifiers || null })),
          paymentMethod: complete ? paymentMethod : "UNPAID",
          amountPaid: complete ? (paymentMethod === "CASH" ? amountTendered : total) : 0,
          discount,
          notes: notes || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          complete,
        });
        clear();
        setDiscount(0);
        setCustomerName("");
        setCustomerPhone("");
        setNotes("");
        setAmountTendered(0);
        if (complete) {
          setCompletedOrder(order);
        } else {
          router.push(`/orders/${order.id}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit order");
      }
    });
  }

  function startNewSale() {
    setCompletedOrder(null);
  }

  return (
    <>
    <div className="flex gap-6 print:hidden">
      <div className="flex-1">
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items…"
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                activeCategory === null
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-gray-400"
              }`}
            >
              ✨ All
            </button>
            {allCategories.map((category) => {
              const color = categoryColor(category);
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                    active ? `${color.chip} text-white` : `${color.bg} ${color.text} ring-1 ring-inset ${color.border} hover:brightness-95`
                  }`}
                >
                  {categoryEmoji(category)} {category}
                </button>
              );
            })}
          </div>
        </div>

        {categories.length === 0 && (
          <p className="text-sm text-gray-400">No menu items match your search.</p>
        )}

        {categories.map(([category, items]) => {
          const color = categoryColor(category);
          return (
            <div key={category} className="mb-7">
              <div className="mb-3 flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color.bg} text-lg ring-1 ${color.border}`}>
                  {categoryEmoji(category)}
                </span>
                <h2 className={`text-sm font-bold uppercase tracking-wide ${color.text}`}>{category}</h2>
                <span className={`h-1 flex-1 rounded-full ${color.accent} opacity-30`} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((p) => {
                  const inCart = lines.find((l) => l.productId === p.id)?.qty ?? 0;
                  const outOfStock = p.stock !== null && p.stock <= 0;
                  const atLimit = p.stock !== null && inCart >= p.stock;
                  const disabled = outOfStock || atLimit;
                  const lowStock = p.stock !== null && p.stock > 0 && p.stock <= 5;
                  return (
                    <button
                      key={p.id}
                      disabled={disabled}
                      onClick={() => addItemToCart({ id: p.id, name: p.name, price: p.price })}
                      className={`group relative flex min-h-[128px] flex-col overflow-hidden rounded-xl border-2 p-3 text-left transition ${
                        disabled
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50 grayscale"
                          : `${color.border} ${color.bg} ${color.hover} hover:-translate-y-0.5 hover:shadow-lg`
                      }`}
                    >
                      <span className={`absolute inset-x-0 top-0 h-1 ${color.accent}`} />

                      {inCart > 0 && (
                        <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[11px] font-bold text-white shadow">
                          {inCart}
                        </span>
                      )}

                      <div className="flex items-center justify-center">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="h-14 w-14 rounded-lg object-cover shadow-sm" />
                        ) : (
                          <span className="text-3xl drop-shadow-sm">{categoryEmoji(category)}</span>
                        )}
                      </div>

                      <div className="mt-2 line-clamp-2 flex-1 text-sm font-semibold text-gray-900">{p.name}</div>

                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color.badge}`}>
                          {formatCentavos(p.price)}
                        </span>
                      </div>

                      <div
                        className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${
                          outOfStock ? "text-red-600" : lowStock ? "text-amber-600" : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            outOfStock ? "bg-red-500" : lowStock ? "bg-amber-500" : p.stock === null ? "bg-gray-300" : "bg-emerald-500"
                          }`}
                        />
                        {p.stock === null
                          ? "Unlimited"
                          : outOfStock
                            ? "Out of stock"
                            : atLimit
                              ? `${p.stock} in stock (max)`
                              : `${p.stock} in stock`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {completedOrder ? (
        <div className="w-96 shrink-0 rounded-md border border-emerald-200 bg-emerald-50 p-4 print:hidden">
          <div className="mb-1 text-lg font-semibold text-emerald-900">Order Placed ✓</div>
          <div className="mb-4 text-sm text-emerald-700">
            Order #{completedOrder.id.slice(-6)} · {formatCentavos(completedOrder.total)}
          </div>

          <div className="mb-4 max-h-64 space-y-1 overflow-y-auto rounded-md bg-white p-3 text-sm">
            {completedOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between text-gray-700">
                <span>
                  {item.qty}x {item.product.name}
                </span>
                <span>{formatCentavos(item.lineTotal)}</span>
              </div>
            ))}
            <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCentavos(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Amount Paid ({completedOrder.paymentMethod})</span>
                <span>{formatCentavos(completedOrder.amountPaid)}</span>
              </div>
              {completedOrder.paymentMethod === "CASH" && completedOrder.amountPaid > completedOrder.total && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Change</span>
                  <span>{formatCentavos(completedOrder.amountPaid - completedOrder.total)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <Printer size={16} />
              Print Receipt for Customer
            </button>
            <button
              onClick={startNewSale}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={16} />
              Start New Sale
            </button>
          </div>
        </div>
      ) : (
      <div className="w-96 shrink-0 rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Order</h2>

        <div>
          <label className="block text-xs font-medium text-gray-700">Order Type</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="DINE_IN">Dine-in</option>
            <option value="WALK_IN">Walk-in / Takeout</option>
            <option value="ONLINE">Online (Messenger quick-entry)</option>
          </select>
        </div>

        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
          {lines.length === 0 && <p className="text-sm text-gray-400">No items yet. Tap a product to add.</p>}
          {lines.map((line) => {
            const maxStock = products.find((p) => p.id === line.productId)?.stock ?? null;
            const atMax = maxStock !== null && line.qty >= maxStock;
            return (
              <div key={line.productId} className="border-b border-gray-100 pb-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{line.name}</span>
                  <span className="text-gray-600">{formatCentavos(line.unitPrice * line.qty)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => updateQty(line.productId, line.qty - 1)}
                    className="h-6 w-6 rounded border border-gray-300 text-sm"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{line.qty}</span>
                  <button
                    disabled={atMax}
                    onClick={() => updateQty(line.productId, line.qty + 1)}
                    className="h-6 w-6 rounded border border-gray-300 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                  <input
                    type="text"
                    placeholder="Modifiers / notes"
                    value={line.modifiers}
                    onChange={(e) => updateModifiers(line.productId, e.target.value)}
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
                  />
                </div>
                {atMax && <div className="mt-0.5 text-xs text-amber-600">Max available stock reached</div>}
              </div>
            );
          })}
        </div>

        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCentavos(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Discount (₱)</span>
            <input
              type="number"
              min={0}
              value={discount / 100}
              onChange={(e) => setDiscount(Math.round(Number(e.target.value) * 100))}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
            />
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCentavos(total)}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Customer phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Order notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="GCASH">GCash</option>
            <option value="CARD">Card</option>
          </select>

          {paymentMethod === "CASH" && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="amount-received" className="font-medium text-gray-700">
                  Amount Received (₱)
                </label>
                <input
                  id="amount-received"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountTendered === 0 ? "" : amountTendered / 100}
                  onChange={(e) => setAmountTendered(Math.round(Number(e.target.value) * 100))}
                  placeholder="0.00"
                  className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                />
              </div>
              <div
                className={`mt-2 flex justify-between text-sm font-semibold ${
                  amountTendered === 0 ? "text-gray-400" : change < 0 ? "text-red-600" : "text-emerald-700"
                }`}
              >
                <span>Change</span>
                <span>{amountTendered > 0 ? formatCentavos(Math.max(0, change)) : "—"}</span>
              </div>
              {amountTendered > 0 && change < 0 && (
                <p className="mt-1 text-xs text-red-600">Short by {formatCentavos(-change)}</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-3 flex gap-2">
          <button
            disabled={pending}
            onClick={() => submit(false)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hold
          </button>
          <button
            disabled={pending}
            onClick={() => submit(true)}
            className="flex-1 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            Complete Sale
          </button>
        </div>

        <button
          disabled={lines.length === 0}
          onClick={() => window.print()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Printer size={16} />
          Print Order
        </button>
      </div>
      )}
    </div>

    {completedOrder ? (
      <Receipt order={completedOrder} branch={branch} />
    ) : (
      lines.length > 0 && <OrderSlip lines={lines} channel={channel} customerName={customerName} />
    )}
    </>
  );
}

const CHANNEL_LABEL: Record<string, string> = {
  DINE_IN: "Dine-in",
  WALK_IN: "Walk-in",
  ONLINE: "Online",
};

/** Print-only order slip for the current (unsubmitted) cart, styled after the KDS order card. */
function OrderSlip({
  lines,
  channel,
  customerName,
}: {
  lines: { productId: string; name: string; qty: number; modifiers: string }[];
  channel: string;
  customerName: string;
}) {
  return (
    <div className="hidden print:block">
      <div className="mx-auto w-full max-w-xs text-sm text-black">
        {customerName && <div className="text-lg font-bold">{customerName}</div>}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-extrabold">Order</span>
          <span className="rounded-full border border-black px-2 py-0.5 text-xs font-medium">
            {CHANNEL_LABEL[channel] || channel}
          </span>
        </div>

        <div className="space-y-1">
          {lines.map((l) => (
            <div key={l.productId}>
              <div className="font-semibold">
                {l.qty}× {l.name}
              </div>
              {l.modifiers && <div className="pl-4 text-xs italic text-gray-600">{l.modifiers}</div>}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>just now</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
