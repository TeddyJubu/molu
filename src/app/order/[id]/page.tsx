import Link from "next/link";
import { notFound } from "next/navigation";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isNocoConfigured()) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Order {id}</h1>
        <p className="mt-3 text-gray-700">
          Configure NocoDB to load order details. Required: NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.
        </p>
        <Link href="/products" className="mt-4 inline-block underline">
          Browse products
        </Link>
      </main>
    );
  }

  try {
    const nocodb = new NocoDBClient();
    const [order, items] = await Promise.all([nocodb.getOrder(id), nocodb.listOrderItems(id)]);

    return (
      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Order {order.id}</h1>
          <p className="text-sm text-gray-700">
            Status: {order.order_status} · Payment: {order.payment_status}
          </p>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-semibold">Items</h2>
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.product_name}</p>
                  <p className="text-gray-600">
                    {item.size} · {item.color} · x{item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">৳{item.subtotal}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-gray-700">Total</span>
            <span className="font-semibold">৳{order.total_amount}</span>
          </div>
        </div>

        <Link href="/products" className="text-sm underline">
          Continue shopping
        </Link>
      </main>
    );
  } catch {
    notFound();
  }
}

