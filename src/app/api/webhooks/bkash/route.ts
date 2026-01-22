import { NextResponse } from "next/server";
import { z } from "zod";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";

const eventSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  status: z.enum(["completed", "failed"])
});

function isAuthorized(request: Request) {
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET;
  if (secret) return request.headers.get("x-webhook-secret") === secret;
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!isNocoConfigured()) {
    return NextResponse.json(
      { error: "NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID." },
      { status: 503 }
    );
  }

  try {
    const nocodb = new NocoDBClient();
    const order = await nocodb.getOrder(parsed.data.orderId);

    if (order.payment_status === "completed") {
      return NextResponse.json({ ok: true });
    }

    if (order.payment_id && order.payment_id !== parsed.data.paymentId) {
      return NextResponse.json({ error: "Payment ID mismatch" }, { status: 409 });
    }

    if (parsed.data.status === "completed") {
      await nocodb.updateOrder(order.id, { payment_status: "completed", order_status: "confirmed" });
    } else {
      await nocodb.updateOrder(order.id, { payment_status: "failed" });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

