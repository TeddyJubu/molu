"use client";

import Link from "next/link";
import { products } from "@/lib/demo-data";
import { useWishlist } from "@/store/wishlist";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";

export default function WishlistPage() {
  const productIds = useWishlist((s) => s.productIds);
  const hasHydrated = useWishlist((s) => s.hasHydrated);
  const clear = useWishlist((s) => s.clear);

  const wishlisted = products.filter((p) => productIds.includes(p.id));

  if (!hasHydrated) {
    return <div className="container mx-auto px-4 py-10" />;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-baseline justify-between gap-6 mb-6">
        <h1 className="font-baloo text-3xl font-bold text-primary">Wishlist</h1>
        {wishlisted.length > 0 ? (
          <Button variant="outline" onClick={() => clear()}>
            Clear
          </Button>
        ) : null}
      </div>

      {wishlisted.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-lg font-medium">No saved items yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on a product to save it for later.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlisted.map((product) => (
            <ProductCard key={product.id} product={product} showDescription />
          ))}
        </div>
      )}
    </div>
  );
}
