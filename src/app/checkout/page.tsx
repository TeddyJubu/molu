"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { DeliveryForm, type DeliveryFormData } from "@/components/checkout/DeliveryForm";
import { PaymentSelector } from "@/components/checkout/PaymentSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import type { ApiResponse } from "@/lib/api/types";
import { apiErrorMessage } from "@/lib/api/types";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);

  const [step, setStep] = useState<"delivery" | "payment">("delivery");
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = useMemo(() => Boolean(deliveryData && paymentMethod && items.length), [deliveryData, items.length, paymentMethod]);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-3 text-gray-700">Your cart is empty.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-2">
        <h1 className="text-2xl font-bold">Checkout</h1>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        {step === "delivery" ? (
          <DeliveryForm
            onSubmit={(data) => {
              setError(null);
              setDeliveryData(data);
              setStep("payment");
            }}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-6">
            <PaymentSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} isProcessing={isLoading} />
            <button
              type="button"
              disabled={!canSubmit || isLoading}
              onClick={async () => {
                if (!deliveryData || !paymentMethod) return;
                setIsLoading(true);
                setError(null);
                try {
                  const res = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      ...deliveryData,
                      items: items.map((i) => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        options: i.options,
                        variantId: i.variantId
                      })),
                      total_amount: total,
                      payment_method: paymentMethod
                    })
                  });

                  const orderBody = (await res.json().catch(() => null)) as ApiResponse<{ id: string }> | null;
                  if (!res.ok || !orderBody || !orderBody.ok) {
                    throw new Error(apiErrorMessage(orderBody));
                  }
                  const { id } = orderBody.data;
                  const payRes = await fetch(`/api/payments/${paymentMethod}`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ orderId: id, amount: total })
                  });

                  const payBody = (await payRes.json().catch(() => null)) as ApiResponse<{ paymentUrl: string }> | null;
                  if (!payRes.ok || !payBody || !payBody.ok) {
                    throw new Error(apiErrorMessage(payBody));
                  }

                  const { paymentUrl } = payBody.data;
                  clear();
                  window.location.href = paymentUrl;
                } catch (e) {
                  const message = e instanceof Error ? e.message : "Unknown error";
                  setError(message);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full rounded bg-black px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Placing order..." : "Place Order"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setError(null);
                setStep("delivery");
              }}
              className="w-full rounded border border-gray-300 px-4 py-3 text-sm"
            >
              Back
            </button>
          </div>
        )}
      </div>

      <div>
        <OrderSummary items={items} total={total} />
      </div>
    </main>
  );
}
