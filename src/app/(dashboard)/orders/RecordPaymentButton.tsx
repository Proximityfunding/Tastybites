"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCentavos } from "@/lib/money";
import { recordOrderPayment } from "./actions";

/** Inline payment recorder for a completed-but-unpaid order: pick method, enter cash tendered, save. */
export default function RecordPaymentButton({ orderId, total }: { orderId: string; total: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"CASH" | "GCASH" | "CARD">("CASH");
  const [amountTendered, setAmountTendered] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = method === "CASH" ? amountTendered - total : 0;

  function save() {
    setError(null);
    if (method === "CASH" && amountTendered < total) {
      setError(amountTendered === 0 ? "Enter amount received" : "Insufficient amount");
      return;
    }
    startTransition(async () => {
      try {
        await recordOrderPayment(orderId, method, method === "CASH" ? amountTendered : total);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record payment");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        Record Payment
      </button>
    );
  }

  return (
    <div className="w-48 space-y-1.5 rounded-md border border-gray-200 bg-gray-50 p-2 text-xs">
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as typeof method)}
        className="w-full rounded border border-gray-300 px-1.5 py-1"
      >
        <option value="CASH">Cash</option>
        <option value="GCASH">GCash</option>
        <option value="CARD">Card</option>
      </select>

      {method === "CASH" && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Received (₱)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amountTendered === 0 ? "" : amountTendered / 100}
              onChange={(e) => setAmountTendered(Math.round(Number(e.target.value) * 100))}
              placeholder="0.00"
              className="w-20 rounded border border-gray-300 px-1.5 py-1 text-right"
            />
          </div>
          <div
            className={`flex justify-between font-semibold ${
              amountTendered === 0 ? "text-gray-400" : change < 0 ? "text-red-600" : "text-emerald-700"
            }`}
          >
            <span>Change</span>
            <span>{amountTendered > 0 ? formatCentavos(Math.max(0, change)) : "—"}</span>
          </div>
        </>
      )}

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="flex-1 rounded bg-emerald-600 px-2 py-1 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="flex-1 rounded border border-gray-300 px-2 py-1 font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
