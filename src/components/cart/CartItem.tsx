"use client";

import Image from "next/image";
import type { CartItem as CartLine } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatOptions } from "@/lib/variants";

export interface CartItemProps {
  item: CartLine;
  onRemove: (criteria: Pick<CartLine, "lineKey">) => void;
  onQuantityChange: (criteria: Pick<CartLine, "lineKey">, quantity: number) => void;
}

export function CartItem({ item, onRemove, onQuantityChange }: CartItemProps) {
  const criteria = { lineKey: item.lineKey };

  return (
    <div className="flex gap-4 py-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-secondary/10">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/10">
            <span className="text-xs text-muted-foreground">No img</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-2">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-sm font-medium leading-none">{item.name}</h3>
            <p className="text-xs text-muted-foreground">
              {formatOptions(item.options)}
            </p>
          </div>
          <p className="font-semibold text-sm">৳{item.price * item.quantity}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              onClick={() => onQuantityChange(criteria, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
              <span className="sr-only">Decrease</span>
            </Button>
            <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              onClick={() => onQuantityChange(criteria, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
              <span className="sr-only">Increase</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(criteria)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
