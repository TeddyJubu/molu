import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export interface WishlistStore {
  productIds: string[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

const memoryStorage: StateStorage = (() => {
  const mem = new Map<string, string>();
  return {
    getItem: (name) => mem.get(name) ?? null,
    setItem: (name, value) => {
      mem.set(name, value);
    },
    removeItem: (name) => {
      mem.delete(name);
    }
  };
})();

const wishlistStorage = createJSONStorage(() => {
  try {
    const storage = localStorage as any;
    if (
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function"
    ) {
      return storage;
    }
  } catch {
  }
  return memoryStorage;
});

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      add: (productId) =>
        set((state) =>
          state.productIds.includes(productId)
            ? state
            : { productIds: [...state.productIds, productId] }
        ),
      remove: (productId) =>
        set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) })),
      toggle: (productId) =>
        set((state) =>
          state.productIds.includes(productId)
            ? { productIds: state.productIds.filter((id) => id !== productId) }
            : { productIds: [...state.productIds, productId] }
        ),
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] })
    }),
    {
      name: "molu-wishlist",
      storage: wishlistStorage,
      version: 1,
      partialize: (state) => ({ productIds: state.productIds }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
