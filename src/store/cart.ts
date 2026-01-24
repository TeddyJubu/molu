import { create } from "zustand";
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
  addItem: (item: Omit<CartItem, "lineKey"> & { lineKey?: string }) => void;
  removeItem: (criteria: Pick<CartItem, "lineKey">) => void;
  updateQuantity: (criteria: Pick<CartItem, "lineKey">, quantity: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
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
}));
