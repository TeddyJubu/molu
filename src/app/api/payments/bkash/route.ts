import { z } from "zod";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { initiateBkashPayment } from "@/lib/payments/bkash";
import { ConfigError, InvalidJsonError } from "@/lib/api/errors";
import { failFromError, ok } from "@/lib/api/response";

const requestSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().optional()
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new InvalidJsonError();
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw parsed.error;
    }

    if (!isNocoConfigured()) {
      throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
    }

    const origin = new URL(request.url).origin;
    const nocodb = new NocoDBClient();
    const order = await nocodb.getOrder(parsed.data.orderId);
    const session = initiateBkashPayment({
      origin,
      orderId: order.id,
      amount: order.total_amount
    });

    await nocodb.updateOrder(order.id, {
      payment_id: session.paymentId,
      payment_status: "pending",
      payment_method: "bkash"
    });

    return ok({ paymentUrl: session.paymentUrl, paymentId: session.paymentId });
  } catch (error) {
    return failFromError(error);
  }
}
