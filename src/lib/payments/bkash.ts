import type { PaymentSession } from "@/lib/payments/types";

export function initiateBkashPayment(params: { origin: string; orderId: string; amount: number }) {
  const rand = Math.random().toString(16).slice(2, 10);
  const paymentId = `BKASH-${Date.now()}-${rand}`;
  const paymentUrl = `${params.origin}/pay/mock?gateway=bkash&orderId=${encodeURIComponent(params.orderId)}&paymentId=${encodeURIComponent(
    paymentId
  )}`;

  const session: PaymentSession = { gateway: "bkash", paymentId, paymentUrl };
  return session;
}

