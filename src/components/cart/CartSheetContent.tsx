"use client";

import { useCart } from "@/store/cart";
import { CartItem } from "@/components/cart/CartItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { products } from "@/lib/demo-data";
import Image from "next/image";
import Link from "next/link";

export function CartSheetContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const total = useCart((s) => s.total());

  if (items.length === 0) {
    const recommended = products.slice(0, 3);
    return (
      <div className="flex h-full flex-col justify-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">Add some items to start shopping.</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => {
              router.push("/products");
              onNavigate?.();
            }}
          >
            Browse Products
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/products?category=boys");
              onNavigate?.();
            }}
          >
            Shop Boys
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/products?category=girls");
              onNavigate?.();
            }}
          >
            Shop Girls
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Popular right now</p>
            <Link
              href="/products"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate?.()}
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3">
            {recommended.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50"
                onClick={() => onNavigate?.()}
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-md bg-secondary/10">
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                </div>
                <p className="text-sm font-semibold text-primary">৳{p.price}</p>
              </Link>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">Checkout is quick and secure.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="divide-y">
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
