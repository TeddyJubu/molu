"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { DeliveryForm, type DeliveryFormData } from "@/components/checkout/DeliveryForm";
import { PaymentSelector } from "@/components/checkout/PaymentSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { fetchApiData } from "@/lib/api/client";

type CheckoutStep = "delivery" | "payment";

type CheckoutDraft = {
  step?: CheckoutStep;
  deliveryDraft?: Partial<DeliveryFormData>;
  deliveryData?: DeliveryFormData;
  paymentMethod?: "bkash" | "nagad" | null;
};

type PendingOrder = {
  orderId: string;
  paymentMethod: "bkash" | "nagad";
  totalAmount: number;
  paymentId?: string;
};

const CHECKOUT_DRAFT_KEY = "molu-checkout-draft";
const PENDING_ORDER_KEY = "molu-pending-order";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
  }
}

export default function CheckoutPage() {
  const hasHydrated = useCart((s) => s.hasHydrated);
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());

  const [step, setStep] = useState<CheckoutStep>("delivery");
  const [deliveryDraft, setDeliveryDraft] = useState<Partial<DeliveryFormData>>({});
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = useMemo(() => Boolean(deliveryData && paymentMethod && items.length), [deliveryData, items.length, paymentMethod]);

  useEffect(() => {
    const draft = readJson<CheckoutDraft>(CHECKOUT_DRAFT_KEY);
    if (!draft) return;
    if (draft.deliveryDraft) setDeliveryDraft(draft.deliveryDraft);
    if (draft.deliveryData) setDeliveryData(draft.deliveryData);
    if (draft.paymentMethod === "bkash" || draft.paymentMethod === "nagad") setPaymentMethod(draft.paymentMethod);
    if (draft.step === "payment" && draft.deliveryData) setStep("payment");
  }, []);

  useEffect(() => {
    if (hasHydrated && !items.length) {
      removeKey(CHECKOUT_DRAFT_KEY);
      return;
    }
    const next: CheckoutDraft = {
      step,
      deliveryDraft,
      deliveryData: deliveryData ?? undefined,
      paymentMethod
    };
    writeJson(CHECKOUT_DRAFT_KEY, next);
  }, [deliveryData, deliveryDraft, hasHydrated, items.length, paymentMethod, step]);

  if (!hasHydrated) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-3 text-muted-foreground">Loading your cart…</p>
      </main>
    );
  }

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
            defaultValues={deliveryDraft}
            onDraftChange={(draft) => {
              setDeliveryDraft(draft);
              const next: CheckoutDraft = {
                step,
                deliveryDraft: draft,
                deliveryData: deliveryData ?? undefined,
                paymentMethod
              };
              writeJson(CHECKOUT_DRAFT_KEY, next);
            }}
            onSubmit={(data) => {
              setError(null);
              setDeliveryData(data);
              setStep("payment");
              const next: CheckoutDraft = {
                step: "payment",
                deliveryDraft,
                deliveryData: data,
                paymentMethod
              };
              writeJson(CHECKOUT_DRAFT_KEY, next);
            }}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-6">
            <PaymentSelector
              selectedMethod={paymentMethod}
              onSelect={(method) => {
                setPaymentMethod(method);
                const next: CheckoutDraft = {
                  step,
                  deliveryDraft,
                  deliveryData: deliveryData ?? undefined,
                  paymentMethod: method
                };
                writeJson(CHECKOUT_DRAFT_KEY, next);
              }}
              isProcessing={isLoading}
            />
            <button
              type="button"
              disabled={!canSubmit || isLoading}
              onClick={async () => {
                if (!deliveryData || !paymentMethod) return;
                setIsLoading(true);
                setError(null);
                try {
                  const orderData = await fetchApiData<{ id: string }>("/api/orders", {
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
                  const { id } = orderData;
                  const payData = await fetchApiData<{ paymentUrl: string; paymentId: string }>(`/api/payments/${paymentMethod}`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ orderId: id, amount: total })
                  });
                  const { paymentUrl, paymentId } = payData;
                  const pending: PendingOrder = { orderId: id, paymentMethod, totalAmount: total, paymentId };
                  writeJson(PENDING_ORDER_KEY, pending);
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
