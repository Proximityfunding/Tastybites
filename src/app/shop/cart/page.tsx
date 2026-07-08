import Link from "next/link";
import Logo from "@/components/Logo";
import CartPageClient from "./CartPageClient";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-orange-50/40">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link href="/shop" className="text-sm font-medium text-gray-500 hover:text-orange-600">
            Menu
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Your Order</h1>
        <CartPageClient />
      </div>
    </div>
  );
}
