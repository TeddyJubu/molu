"use client";

import { useCart } from "@/store/cart";
import { CartItem } from "@/components/cart/CartItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export function CartSheetContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const total = useCart((s) => s.total());

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">Add some items to start shopping.</p>
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            router.push("/products");
            onNavigate?.();
          }}
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="divide-y">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}:${item.size}:${item.color}`}
              item={item}
              onRemove={removeItem}
              onQuantityChange={updateQuantity}
            />
          ))}
        </div>
      </div>
      
      <div className="space-y-4 pt-4">
        <Separator />
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-sm">Subtotal</span>
            <span className="text-sm font-medium">৳{total}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span className="text-xs">Shipping</span>
            <span className="text-xs">Calculated at checkout</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 font-medium">
            <span>Total</span>
            <span>৳{total}</span>
          </div>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            router.push("/checkout");
            onNavigate?.();
          }}
        >
          Checkout
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            router.push("/cart");
            onNavigate?.();
          }}
        >
          View Cart
        </Button>
      </div>
    </div>
  );
}
