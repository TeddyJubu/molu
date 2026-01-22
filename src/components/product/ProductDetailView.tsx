"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/demo-data";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Star, Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductDetailView({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor,
      quantity,
      image: product.image,
    });
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
        {product.isNew && (
          <Badge className="absolute left-4 top-4 bg-blue-500 text-lg py-1 px-3">New Arrival</Badge>
        )}
        {product.isSale && (
          <Badge variant="destructive" className="absolute left-4 top-4 bg-red-500 text-lg py-1 px-3">Sale</Badge>
        )}
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
            <span className="text-sm font-medium">Select Size</span>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-all hover:border-primary",
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
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-all hover:border-primary",
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
          <Button size="lg" className="w-full text-lg h-12" onClick={handleAddToCart}>
            <ShoppingBag className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
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
