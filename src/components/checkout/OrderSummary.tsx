"use client";

import type { CartItem } from "@/store/cart";
import { formatOptions } from "@/lib/variants";

export interface OrderSummaryProps {
  items: CartItem[];
  total: number;
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <h2 className="text-lg font-semibold">Order Summary</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.lineKey} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-gray-600">
                {formatOptions(item.options)} · x{item.quantity}
              </p>
            </div>
            <p className="shrink-0 font-semibold">৳{item.price * item.quantity}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-gray-700">Total</span>
        <span className="font-semibold">৳{total}</span>
      </div>
    </div>
  );
}
