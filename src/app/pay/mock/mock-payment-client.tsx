"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function MockPaymentClient() {
  const router = useRouter();
  const params = useSearchParams();
  const gateway = params.get("gateway");
  const orderId = params.get("orderId");
  const paymentId = params.get("paymentId");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => gateway === "bkash" || gateway === "nagad", [gateway]);

  if (!valid || !orderId || !paymentId) {
    return (
      <main className="mx-auto max-w-xl space-y-3 p-6">
        <h1 className="text-2xl font-bold">Mock Payment</h1>
        <p className="text-gray-700">Missing or invalid payment parameters.</p>
      </main>
    );
  }

  async function send(status: "completed" | "failed") {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/webhooks/${gateway}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, paymentId, status })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Webhook failed");
      }

      router.push(`/order/${orderId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Mock Payment ({gateway})</h1>
        <p className="text-sm text-gray-700">Order: {orderId}</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-3 rounded border bg-white p-4">
        <p className="text-sm text-gray-700">Simulate a payment outcome:</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => send("completed")}
            className="flex-1 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "Working..." : "Success"}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => send("failed")}
            className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-60"
          >
            Fail
          </button>
        </div>
      </div>
    </main>
  );
}
