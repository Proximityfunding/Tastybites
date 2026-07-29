"use client";

import { useState } from "react";

const SAMPLE_ITEMS = [
  { qty: 2, name: "Egg Cheese burger", price: "₱240.00" },
  { qty: 1, name: "Large Fries", price: "₱70.00" },
  { qty: 1, name: "Classic Milk Tea - 16 oz", price: "₱65.00" },
];

/**
 * Live paper-width field + preview of both print layouts, so changing the number
 * immediately shows whether content will fit — same width used for the real
 * @page rule in (dashboard)/layout.tsx, no reload needed to see the effect here.
 */
export default function PrintPreview({ defaultValue }: { defaultValue: number }) {
  const [width, setWidth] = useState(defaultValue);

  return (
    <div>
      <label htmlFor="receiptPaperWidthMm" className="block text-sm font-medium text-gray-700">
        Receipt Paper Width (mm)
      </label>
      <input
        id="receiptPaperWidthMm"
        name="receiptPaperWidthMm"
        type="number"
        min={20}
        max={120}
        step={1}
        value={width}
        onChange={(e) => setWidth(Math.max(0, Math.round(Number(e.target.value) || 0)))}
        className="mt-1 w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
      />
      <p className="mt-1 text-xs text-gray-400">
        The actual printable width of your thermal roll — not the roll size itself. A "58mm" printer
        often only prints ~43-48mm; if receipts print with the right edge cut off, lower this number.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        <PreviewPaper label="Print Order (kitchen slip)" widthMm={width}>
          <div className="mb-2">
            <div className="text-lg font-extrabold">Order</div>
            <div className="text-sm font-semibold">Maria Santos</div>
            <div className="mt-0.5 text-xs font-medium">Dine-in</div>
          </div>
          <div className="space-y-1">
            {SAMPLE_ITEMS.map((item) => (
              <div key={item.name} className="font-semibold">
                {item.qty}× {item.name}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>just now</span>
            <span>3:45:00 PM</span>
          </div>
        </PreviewPaper>

        <PreviewPaper label="Customer Receipt" widthMm={width}>
          <div className="font-mono text-[10px] leading-snug">
            <div className="text-center">
              <div className="text-sm font-bold">Tasty Bites Snacks &amp; Drinks</div>
              <div>Parañaque City, Metro Manila</div>
            </div>
            <Divider />
            <div className="text-center font-bold">ORDER ACKNOWLEDGEMENT</div>
            <Divider />
            <PreviewRow label="Order #" value="BC47OM7J" />
            <PreviewRow label="Date" value="7/29/2026, 3:45:00 PM" />
            <PreviewRow label="Channel" value="DINE IN" />
            <Divider />
            {SAMPLE_ITEMS.map((item) => (
              <div key={item.name} className="mb-1 flex justify-between gap-2">
                <span className="min-w-0 flex-1 break-words">
                  {item.qty}x {item.name}
                </span>
                <span className="shrink-0">{item.price}</span>
              </div>
            ))}
            <Divider />
            <div className="flex justify-between gap-2 text-sm font-bold">
              <span>TOTAL</span>
              <span>₱375.00</span>
            </div>
            <Divider />
            <PreviewRow label="Payment" value="CASH" />
            <PreviewRow label="Amount Paid" value="₱400.00" />
            <PreviewRow label="Change" value="₱25.00" />
            <Divider />
            <div className="text-center">
              <div>Thank you for your order!</div>
              <div>Please come again.</div>
            </div>
          </div>
        </PreviewPaper>
      </div>
    </div>
  );
}

function PreviewPaper({ label, widthMm, children }: { label: string; widthMm: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-gray-500">
        {label} · {widthMm}mm
      </div>
      <div
        style={{ width: `${widthMm}mm` }}
        className="max-w-full border border-dashed border-gray-300 bg-white px-[1mm] py-2 text-xs text-black shadow-sm"
      >
        {children}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="shrink-0">{label}</span>
      <span className="min-w-0 flex-1 break-words text-right">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="my-1 border-t border-dashed border-black" />;
}
