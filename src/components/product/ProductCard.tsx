"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/lib/demo-data";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { toast } from "sonner";

export interface ProductCardProps {
  product: Product;
  showDescription?: boolean;
}

export function ProductCard({ product, showDescription = false }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const isWishlisted = useWishlist((s) => s.productIds.includes(product.id));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      options: { "Age Range": product.sizes[0] ?? "", Color: product.colors[0] ?? "" },
      quantity: 1,
      image: product.image
    });

    toast.success("Added to cart", {
      action: {
        label: "View cart",
        onClick: () => {
          window.location.href = "/cart";
        }
      }
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist");
  };

  return (
    <Card className="group h-full overflow-hidden border-none shadow-sm transition-all hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="block h-full">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/10">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-background hover:text-foreground"
          >
            <Heart className={isWishlisted ? "h-4 w-4 fill-rose-500 text-rose-500" : "h-4 w-4"} />
          </button>
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isNew ? (
              <Badge className="rounded-full border-0 bg-blue-600 text-white shadow-sm ring-1 ring-white/30 hover:bg-blue-700">
                New
              </Badge>
            ) : null}
            {product.isSale ? (
              <Badge
                variant="destructive"
                className="rounded-full border-0 bg-red-600 text-white shadow-sm ring-1 ring-white/30 hover:bg-red-700"
              >
                Sale
              </Badge>
            ) : null}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 md:translate-y-full md:transition-transform md:duration-300 md:group-hover:translate-y-0 md:group-focus-within:translate-y-0">
             <Button className="w-full" onClick={handleAddToCart} type="button">
               Add to cart
             </Button>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-1 text-yellow-500 mb-1">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-xs font-medium text-muted-foreground">{product.rating} ({product.reviews})</span>
          </div>
          <h3 title={product.name} className="line-clamp-2 min-h-[3.25rem] font-medium text-lg leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
          {showDescription ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          ) : null}
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <p className="font-bold text-lg text-primary">৳{product.price}</p>
        </CardFooter>
      </Link>
    </Card>
  );
}
