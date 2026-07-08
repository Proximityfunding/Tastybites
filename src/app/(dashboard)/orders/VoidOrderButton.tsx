"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voidOrderAction } from "./actions";

export default function VoidOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const reason = window.prompt("Reason for voiding this order:");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }
    if (!window.confirm("Void this order? This cannot be undone.")) return;

    setError(null);
    const formData = new FormData();
    formData.set("reason", reason.trim());
    startTransition(async () => {
      try {
        await voidOrderAction(orderId, formData);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to void order");
      }
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Voiding…" : "Void"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
