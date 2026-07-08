import { create } from "zustand";

export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number; // centavos
  qty: number;
  modifiers: string;
};

type CartState = {
  lines: CartLine[];
  addItem: (product: { id: string; name: string; price: number }) => void;
  updateQty: (productId: string, qty: number) => void;
  updateModifiers: (productId: string, modifiers: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addItem: (product) =>
    set((state) => {
      const existing = state.lines.find((l) => l.productId === product.id);
      if (existing) {
        return {
          lines: state.lines.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + 1 } : l)),
        };
      }
      return {
        lines: [
          ...state.lines,
          { productId: product.id, name: product.name, unitPrice: product.price, qty: 1, modifiers: "" },
        ],
      };
    }),
  updateQty: (productId, qty) =>
    set((state) => ({
      lines:
        qty <= 0
          ? state.lines.filter((l) => l.productId !== productId)
          : state.lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    })),
  updateModifiers: (productId, modifiers) =>
    set((state) => ({
      lines: state.lines.map((l) => (l.productId === productId ? { ...l, modifiers } : l)),
    })),
  removeItem: (productId) => set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
  clear: () => set({ lines: [] }),
}));
