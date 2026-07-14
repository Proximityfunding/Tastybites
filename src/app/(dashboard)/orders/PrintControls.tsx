"use client";

import { useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Printer } from "lucide-react";

/**
 * Switches between the two print-only views on the order detail page: the customer
 * acknowledgement receipt and the kitchen-style order slip. Only the selected view is
 * mounted, so window.print() always prints exactly one of them.
 */
export default function PrintControls({ receipt, slip }: { receipt: ReactNode; slip: ReactNode }) {
  const [mode, setMode] = useState<"receipt" | "slip">("receipt");

  function print(next: "receipt" | "slip") {
    flushSync(() => setMode(next));
    window.print();
  }

  return (
    <>
      <div className="flex gap-2 print:hidden">
        <button
          onClick={() => print("slip")}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Printer size={14} />
          Print Order
        </button>
        <button
          onClick={() => print("receipt")}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Printer size={14} />
          Print Receipt
        </button>
      </div>
      {mode === "receipt" ? receipt : slip}
    </>
  );
}
