import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { orderSchema } from "@/lib/validation";
import { ConfigError, InvalidJsonError } from "@/lib/api/errors";
import { failFromError, ok } from "@/lib/api/response";
import { notifyOrderCreated } from "@/lib/notifications";
import { canonicalizeOptions, formatOptions, pickFirstTwoOptions } from "@/lib/variants";

function orderId() {
  const rand = Math.random().toString(16).slice(2, 10);
  return `ORD-${Date.now()}-${rand}`;
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new InvalidJsonError();
    }

    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      throw parsed.error;
    }

    if (!isNocoConfigured()) {
      throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
    }

    const nocodb = new NocoDBClient();
    const products = await Promise.all(parsed.data.items.map((i) => nocodb.getProductById(i.productId)));
    const priceById = new Map(products.map((p) => [p.id, p.price] as const));
    const nameById = new Map(products.map((p) => [p.id, p.name] as const));

    const total_amount = parsed.data.items.reduce((sum, item) => {
      const price = priceById.get(item.productId);
      return sum + (price ?? 0) * item.quantity;
    }, 0);

    const id = orderId();
    const origin = new URL(request.url).origin;

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
      const baseName = nameById.get(item.productId) ?? "Unknown";
      const options = canonicalizeOptions((item as any).options);
      const optionsLabel = formatOptions(options);
      const { first, second } = pickFirstTwoOptions(options);
      const product_name = optionsLabel === "Default" ? baseName : `${baseName} (${optionsLabel})`;
      await nocodb.createOrderItem({
        order_id: id,
        product_id: item.productId,
        product_name,
        product_price,
        size: first,
        color: second,
        quantity: item.quantity,
        subtotal: product_price * item.quantity
      });
    }

    await notifyOrderCreated({
      origin,
      orderId: id,
      email: parsed.data.customer_email,
      phone: parsed.data.customer_phone,
      customerName: parsed.data.customer_name,
      totalAmount: total_amount,
      paymentMethod: parsed.data.payment_method
    });

    return ok({ id });
  } catch (error) {
    return failFromError(error);
  }
}
