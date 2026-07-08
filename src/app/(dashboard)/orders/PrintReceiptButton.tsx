"use client";

export default function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      Print Receipt
    </button>
  );
}
