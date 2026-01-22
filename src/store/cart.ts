import { create } from "zustand";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
}

function sameLine(a: CartItem, b: CartItem) {
  return a.productId === b.productId && a.size === b.size && a.color === b.color;
}

export interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (criteria: Pick<CartItem, "productId" | "size" | "color">) => void;
  updateQuantity: (
    criteria: Pick<CartItem, "productId" | "size" | "color">,
    quantity: number
  ) => void;
  clear: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => sameLine(i, item));
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            sameLine(i, item) ? { ...i, quantity: i.quantity + item.quantity } : i
          )
        };
      }
      return { items: [...state.items, item] };
    });
  },
  removeItem: (criteria) => {
    set((state) => ({
      items: state.items.filter(
        (i) =>
          !(
            i.productId === criteria.productId &&
            i.size === criteria.size &&
            i.color === criteria.color
          )
      )
    }));
  },
  updateQuantity: (criteria, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === criteria.productId && i.size === criteria.size && i.color === criteria.color
          ? { ...i, quantity: Math.max(1, quantity) }
          : i
      )
    }));
  },
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}));

