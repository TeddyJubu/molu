"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.total());

  return (
    <main className="container mx-auto max-w-5xl p-6 py-12">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-baloo text-3xl font-bold text-primary">Your Cart</h1>
        <Button asChild variant="link">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {items.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center shadow-sm">
              <p className="text-muted-foreground mb-4">Your cart is empty.</p>
              <Button asChild>
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-card shadow-sm divide-y">
              <div className="p-6 space-y-6">
                {items.map((item) => (
                  <CartItem
                    key={item.lineKey}
                    item={item}
                    onRemove={removeItem}
                    onQuantityChange={updateQuantity}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {items.length > 0 && (
            <CartSummary total={total} onClear={clear} />
          )}
        </div>
      </div>
    </main>
  );
}
