import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { canonicalizeOptions, optionsKey } from "@/lib/variants";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  variantId?: string;
  options: Record<string, string>;
  quantity: number;
  image: string;
  lineKey: string;
}

function lineKeyOf(input: Pick<CartItem, "productId" | "variantId" | "options">) {
  const variantId = input.variantId ? String(input.variantId) : "";
  return `${input.productId}::${variantId}::${optionsKey(input.options)}`;
}

export interface CartStore {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (item: Omit<CartItem, "lineKey"> & { lineKey?: string }) => void;
  removeItem: (criteria: Pick<CartItem, "lineKey">) => void;
  updateQuantity: (criteria: Pick<CartItem, "lineKey">, quantity: number) => void;
  clear: () => void;
  total: () => number;
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

const cartStorage = createJSONStorage(() => {
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

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addItem: (item) => {
        const normalized = {
          ...item,
          options: canonicalizeOptions(item.options),
          lineKey: item.lineKey ?? lineKeyOf(item as any)
        } as CartItem;
        set((state) => {
          const existingItem = state.items.find((i) => i.lineKey === normalized.lineKey);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.lineKey === normalized.lineKey ? { ...i, quantity: i.quantity + normalized.quantity } : i
              )
            };
          }
          return { items: [...state.items, normalized] };
        });
      },
      removeItem: (criteria) => {
        set((state) => ({
          items: state.items.filter((i) => i.lineKey !== criteria.lineKey)
        }));
      },
      updateQuantity: (criteria, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.lineKey === criteria.lineKey ? { ...i, quantity: Math.max(1, quantity) } : i
          )
        }));
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }),
    {
      name: "molu-cart",
      storage: cartStorage,
      version: 1,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
