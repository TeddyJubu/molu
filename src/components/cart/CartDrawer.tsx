"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.total());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close cart" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <p className="text-sm font-semibold">Cart</p>
          <button type="button" onClick={onClose} className="text-sm underline underline-offset-4">
            Close
          </button>
        </div>

        <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-gray-700">Your cart is empty.</p>
              <Link href="/products" className="inline-block underline">
                Browse products
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                {items.map((item) => (
                  <CartItem
                    key={`${item.productId}:${item.size}:${item.color}`}
                    item={item}
                    onRemove={removeItem}
                    onQuantityChange={updateQuantity}
                  />
                ))}
              </div>
              <CartSummary total={total} onClear={clear} />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

