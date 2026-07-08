"use client";

import { useState } from "react";

type Ingredient = { id: string; name: string; unit: string };
type Row = { ingredientId: string; quantity: string };

export default function RecipeInput({
  ingredients,
  initialRows = [],
}: {
  ingredients: Ingredient[];
  initialRows?: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(
    initialRows.length > 0 ? initialRows : [{ ingredientId: "", quantity: "" }]
  );

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ingredientId: "", quantity: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Recipe (ingredients per 1 unit sold)</label>
      <div className="mt-1 space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              name="ingredientId"
              value={row.ingredientId}
              onChange={(e) => updateRow(index, { ingredientId: e.target.value })}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="">Select ingredient…</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
            <input
              name="quantity"
              type="number"
              step="0.01"
              placeholder="Qty"
              value={row.quantity}
              onChange={(e) => updateRow(index, { quantity: e.target.value })}
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="mt-2 text-sm text-orange-600 hover:underline">
        + Add ingredient
      </button>
    </div>
  );
}
