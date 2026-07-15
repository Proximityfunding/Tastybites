import Link from "next/link";
import { getDefaultBranch } from "@/lib/branch";
import Logo from "@/components/Logo";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const branch = await getDefaultBranch();

  return (
    <div className="min-h-screen bg-orange-50/40">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>
        <CheckoutForm gcashNumber={branch.gcashNumber ?? branch.phone} gcashName={branch.name} />
      </div>
    </div>
  );
}
