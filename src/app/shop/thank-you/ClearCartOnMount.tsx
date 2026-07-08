"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart";

export default function ClearCartOnMount() {
  const clear = useCartStore((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
