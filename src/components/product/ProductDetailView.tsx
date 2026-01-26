"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/demo-data";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Star, Check, ShoppingBag, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductDetailView({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((s) => s.addItem);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const isWishlisted = useWishlist((s) => s.productIds.includes(product.id));

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      options: { "Age Range": selectedSize, Color: selectedColor },
      quantity,
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

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Gallery (Simplified to single image for demo, could be carousel) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary/10 border">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-background hover:text-foreground"
        >
          <Heart className={isWishlisted ? "h-5 w-5 fill-rose-500 text-rose-500" : "h-5 w-5"} />
        </button>
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {product.isNew ? (
            <Badge className="bg-blue-500 text-lg py-1 px-3">New Arrival</Badge>
          ) : null}
          {product.isSale ? (
            <Badge variant="destructive" className="bg-red-500 text-lg py-1 px-3">Sale</Badge>
          ) : null}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="font-baloo text-3xl font-bold md:text-4xl text-primary">{product.name}</h1>
          <div className="mt-2 flex items-center gap-4">
            <p className="text-2xl font-semibold text-foreground">৳{product.price}</p>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span className="text-sm font-medium text-muted-foreground ml-1">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
          </div>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed">
          {product.description}
        </p>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-3">
            <span className="text-sm font-medium">Select Age Range</span>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                  className={cn(
                    "flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-medium">Select Color</span>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-pressed={selectedColor === color}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    selectedColor === color
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-foreground"
                  )}
                >
                  {selectedColor === color && <Check className="mr-2 h-3 w-3" />}
                  {color}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
           <span className="text-sm font-medium">Quantity</span>
           <div className="flex items-center gap-4">
             <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex h-10 w-12 items-center justify-center border-x text-center text-sm font-medium">
                  {quantity}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
             </div>
           </div>
        </div>

        <div className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button size="lg" className="w-full text-lg h-12" onClick={handleAddToCart}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="w-full text-lg h-12" onClick={handleToggleWishlist}>
              <Heart className={isWishlisted ? "mr-2 h-5 w-5 fill-rose-500 text-rose-500" : "mr-2 h-5 w-5"} />
              {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground pt-4">
           <div className="flex items-center gap-2">
             <Check className="h-4 w-4 text-green-500" />
             <span>In Stock</span>
           </div>
           <div className="flex items-center gap-2">
             <Check className="h-4 w-4 text-green-500" />
             <span>Fast Delivery</span>
           </div>
           <div className="flex items-center gap-2">
             <Check className="h-4 w-4 text-green-500" />
             <span>Easy Returns</span>
           </div>
           <div className="flex items-center gap-2">
             <Check className="h-4 w-4 text-green-500" />
             <span>Secure Payment</span>
           </div>
        </div>
      </div>
    </div>
  );
}
