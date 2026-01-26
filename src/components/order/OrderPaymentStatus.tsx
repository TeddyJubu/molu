"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApiData } from "@/lib/api/client";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import Link from "next/link";

type PendingOrder = {
  orderId: string;
  paymentMethod: "bkash" | "nagad";
  totalAmount: number;
  paymentId?: string;
};

const PENDING_ORDER_KEY = "molu-pending-order";

function readPendingOrder(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingOrder;
  } catch {
    return null;
  }
}

function removePendingOrder() {
  try {
    localStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
  }
}

export function OrderPaymentStatus({
  orderId,
  paymentStatus,
  paymentMethod,
  totalAmount,
}: {
  orderId: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
}) {
  const clearCart = useCart((s) => s.clear);
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const p = readPendingOrder();
    setPending(p);

    if (!p || p.orderId !== orderId) return;
    if (paymentStatus === "completed") {
      clearCart();
      removePendingOrder();
      setPending(null);
    }
  }, [clearCart, orderId, paymentStatus]);

  const normalizedMethod = paymentMethod === "bkash" || paymentMethod === "nagad" ? paymentMethod : null;

  async function startPayment() {
    if (!normalizedMethod) return;
    startTransition(() => {
      fetchApiData<{ paymentUrl: string; paymentId: string }>(`/api/payments/${normalizedMethod}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, amount: totalAmount })
      })
        .then(({ paymentUrl, paymentId }) => {
          try {
            localStorage.setItem(
              PENDING_ORDER_KEY,
              JSON.stringify({ orderId, paymentMethod: normalizedMethod, totalAmount, paymentId } satisfies PendingOrder)
            );
          } catch {
          }
          window.location.href = paymentUrl;
        })
        .catch((e) => {
          const message = e instanceof Error ? e.message : "Failed to start payment";
          toast.error(message);
        });
    });
  }

  if (paymentStatus === "completed") {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 hover:bg-green-600">Paid</Badge>
            <span className="text-sm text-muted-foreground">Payment completed</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Payment failed</Badge>
            <span className="text-sm text-red-700">Retry to confirm your order.</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={!normalizedMethod || isPending} onClick={startPayment}>
              Retry payment
            </Button>
            <Button asChild type="button" variant="outline" disabled={isPending}>
              <Link href="/checkout">Back to checkout</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Payment pending</Badge>
          <span className="text-sm text-muted-foreground">
            {pending?.orderId === orderId ? "You have an active payment session." : "If you already paid, refresh this page."}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => window.location.reload()}>
            Refresh status
          </Button>
          <Button type="button" disabled={!normalizedMethod || isPending} onClick={startPayment}>
            Continue payment
          </Button>
        </div>
      </div>
    </div>
  );
}

