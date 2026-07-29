"use client";

import { Menu } from "lucide-react";
import { useMobileNav } from "@/lib/mobileNav";

export default function MobileMenuButton() {
  const toggle = useMobileNav((state) => state.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open menu"
      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
    >
      <Menu size={20} />
    </button>
  );
}
