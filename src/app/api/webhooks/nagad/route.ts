import { z } from "zod";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { ConfigError, InvalidJsonError } from "@/lib/api/errors";
import { fail, failFromError, ok } from "@/lib/api/response";
import { notifyPaymentCompleted, notifyPaymentFailed } from "@/lib/notifications";

const eventSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  status: z.enum(["completed", "failed"])
});

function isAuthorized(request: Request) {
  if (process.env.ALLOW_MOCK_WEBHOOKS === "true" && request.headers.get("x-mock-payment") === "true") return true;
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET;
  if (secret) return request.headers.get("x-webhook-secret") === secret;
  if (process.env.ALLOW_MOCK_WEBHOOKS === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return fail(403, "UNAUTHORIZED", "Unauthorized");
  }

  try {
    if (!isNocoConfigured()) {
      throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new InvalidJsonError();
    }

    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      throw parsed.error;
    }

    const nocodb = new NocoDBClient();
    const order = await nocodb.getOrder(parsed.data.orderId);
    const origin = new URL(request.url).origin;
    const paymentMethod = order.payment_method || "nagad";

    if (order.payment_status === "completed") {
      return ok({ status: "already_completed" });
    }

    if (order.payment_id && order.payment_id !== parsed.data.paymentId) {
      return fail(409, "PAYMENT_ID_MISMATCH", "Payment ID mismatch");
    }

    if (parsed.data.status === "completed") {
      await nocodb.updateOrder(order.id, {
        payment_status: "completed",
        order_status: "confirmed",
        payment_id: parsed.data.paymentId,
        ...(order.payment_method ? {} : { payment_method: paymentMethod })
      });
      await notifyPaymentCompleted({
        origin,
        orderId: order.id,
        email: order.customer_email,
        phone: order.customer_phone,
        totalAmount: order.total_amount,
        paymentMethod,
        paymentId: parsed.data.paymentId
      });
    } else {
      await nocodb.updateOrder(order.id, {
        payment_status: "failed",
        payment_id: parsed.data.paymentId,
        ...(order.payment_method ? {} : { payment_method: paymentMethod })
      });
      await notifyPaymentFailed({
        origin,
        orderId: order.id,
        email: order.customer_email,
        phone: order.customer_phone,
        customerName: order.customer_name,
        totalAmount: order.total_amount,
        paymentMethod,
        paymentId: parsed.data.paymentId
      });
    }

    return ok({ status: "ok" });
  } catch (error) {
    return failFromError(error);
  }
}
