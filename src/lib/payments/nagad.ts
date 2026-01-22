import type { PaymentSession } from "@/lib/payments/types";

export function initiateNagadPayment(params: { origin: string; orderId: string; amount: number }) {
  const rand = Math.random().toString(16).slice(2, 10);
  const paymentId = `NAGAD-${Date.now()}-${rand}`;
  const paymentUrl = `${params.origin}/pay/mock?gateway=nagad&orderId=${encodeURIComponent(params.orderId)}&paymentId=${encodeURIComponent(
    paymentId
  )}`;

  const session: PaymentSession = { gateway: "nagad", paymentId, paymentUrl };
  return session;
}

