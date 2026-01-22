export type PaymentGateway = "bkash" | "nagad";

export interface PaymentSession {
  paymentId: string;
  paymentUrl: string;
  gateway: PaymentGateway;
}

export type PaymentStatus = "completed" | "failed";

export interface PaymentWebhookEvent {
  orderId: string;
  paymentId: string;
  status: PaymentStatus;
}

