"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { Product } from "@/lib/demo-data";
import { useCart } from "@/store/cart";
import { toast } from "sonner"; // Assuming toast is available, or use window.alert/console for now

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: product.sizes[0], // Default size
      color: product.colors[0], // Default color
      quantity: 1,
      image: product.image,
    });
    
    // Simple feedback since we haven't installed sonner yet
    // console.log("Added to cart");
  };

  return (
    <Card className="group h-full overflow-hidden border-none shadow-sm transition-all hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="block h-full">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/10">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.isNew && (
            <Badge className="absolute left-2 top-2 bg-blue-500 hover:bg-blue-600">New</Badge>
          )}
          {product.isSale && (
            <Badge variant="destructive" className="absolute left-2 top-2 bg-red-500 hover:bg-red-600">Sale</Badge>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
             <Button className="w-full" onClick={handleAddToCart}>
               Quick Add
             </Button>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-1 text-yellow-500 mb-1">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-xs font-medium text-muted-foreground">{product.rating} ({product.reviews})</span>
          </div>
          <h3 className="line-clamp-1 font-medium text-lg">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{product.category}</p>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <p className="font-bold text-lg text-primary">৳{product.price}</p>
        </CardFooter>
      </Link>
    </Card>
  );
}
