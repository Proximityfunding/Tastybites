"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Silently re-fetches the current route on an interval so new data appears without a manual refresh. */
export default function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
