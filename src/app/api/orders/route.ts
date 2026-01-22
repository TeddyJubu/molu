import { NextResponse } from "next/server";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { orderSchema } from "@/lib/validation";

function orderId() {
  const rand = Math.random().toString(16).slice(2, 10);
  return `ORD-${Date.now()}-${rand}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  if (!isNocoConfigured()) {
    return NextResponse.json(
      { error: "NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID." },
      { status: 503 }
    );
  }

  try {
    const nocodb = new NocoDBClient();
    const products = await Promise.all(parsed.data.items.map((i) => nocodb.getProductById(i.productId)));
    const priceById = new Map(products.map((p) => [p.id, p.price] as const));
    const nameById = new Map(products.map((p) => [p.id, p.name] as const));

    const total_amount = parsed.data.items.reduce((sum, item) => {
      const price = priceById.get(item.productId);
      return sum + (price ?? 0) * item.quantity;
    }, 0);

    const id = orderId();

    await nocodb.createOrder({
      id,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
      customer_email: parsed.data.customer_email,
      customer_address: parsed.data.customer_address,
      customer_district: parsed.data.customer_district,
      special_instructions: parsed.data.special_instructions ?? null,
      total_amount,
      payment_method: parsed.data.payment_method,
      payment_status: "pending",
      payment_id: null,
      order_status: "pending"
    });

    for (const item of parsed.data.items) {
      const product_price = priceById.get(item.productId) ?? 0;
      await nocodb.createOrderItem({
        order_id: id,
        product_id: item.productId,
        product_name: nameById.get(item.productId) ?? "Unknown",
        product_price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        subtotal: product_price * item.quantity
      });
    }

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

