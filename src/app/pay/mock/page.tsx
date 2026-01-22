import { Suspense } from "react";
import { MockPaymentClient } from "@/app/pay/mock/mock-payment-client";

export const dynamic = "force-dynamic";

export default function MockPaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-xl space-y-3 p-6">
          <h1 className="text-2xl font-bold">Mock Payment</h1>
          <p className="text-gray-700">Loading...</p>
        </main>
      }
    >
      <MockPaymentClient />
    </Suspense>
  );
}

