"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface CartSummaryProps {
  total: number;
  onClear?: () => void;
}

export function CartSummary({ total, onClear }: CartSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">৳{total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground text-sm">Calculated at checkout</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>৳{total}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button asChild className="w-full" size="lg">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
        {onClear && (
          <Button variant="outline" className="w-full" onClick={onClear}>
            Clear Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
