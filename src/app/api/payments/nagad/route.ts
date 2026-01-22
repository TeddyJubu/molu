import { NextResponse } from "next/server";
import { z } from "zod";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { initiateNagadPayment } from "@/lib/payments/nagad";

const requestSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().optional()
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }

  if (!isNocoConfigured()) {
    return NextResponse.json(
      { error: "NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID." },
      { status: 503 }
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const nocodb = new NocoDBClient();
    const order = await nocodb.getOrder(parsed.data.orderId);
    const session = initiateNagadPayment({
      origin,
      orderId: order.id,
      amount: order.total_amount
    });

    await nocodb.updateOrder(order.id, {
      payment_id: session.paymentId,
      payment_status: "pending"
    });

    return NextResponse.json({ paymentUrl: session.paymentUrl, paymentId: session.paymentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

