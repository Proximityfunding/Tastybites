import { create } from "zustand";

type MobileNavState = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

/** Controls the off-canvas sidebar drawer on small screens; irrelevant at the `lg` breakpoint and up. */
export const useMobileNav = create<MobileNavState>((set) => ({
  open: false,
  toggle: () => set((state) => ({ open: !state.open })),
  close: () => set({ open: false }),
}));
