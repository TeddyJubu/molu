import Link from "next/link";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asErrorMessage } from "@/lib/api/errors";
import { Order, OrderItem } from "@/types";
import { updateOrderStatusAction } from "@/app/admin/_actions";

export const dynamic = "force-dynamic";

const orderStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isNocoConfigured()) {
    return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">NocoDB is not configured.</div>;
  }

  let order: Order | null = null;
  let items: OrderItem[] = [];
  let error: string | null = null;

  try {
    const nocodb = new NocoDBClient();
    order = await nocodb.getOrder(id);
    items = await nocodb.listOrderItems(id);
  } catch (e) {
    error = asErrorMessage(e);
  }

  if (error || !order) {
    return (
      <main className="space-y-6">
        <Link href="/admin/orders" className="text-sm underline">
          Back to orders
        </Link>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Failed to load order details</p>
          <p>{error ?? "Order not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Link href="/admin/orders" className="text-sm underline">
            Back to orders
          </Link>
          <h2 className="text-xl font-semibold">{order.id}</h2>
          <div className="text-sm text-muted-foreground">
            {order.customer_name} · {order.customer_phone} · {order.customer_email}
          </div>
        </div>
        <form action={updateOrderStatusAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="order_status">
              Order status
            </label>
            <select
              id="order_status"
              name="order_status"
              defaultValue={order.order_status}
              className="h-9 rounded border bg-background px-2 text-sm"
            >
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Update
            </Button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border p-4 md:col-span-2">
          <div className="text-sm font-medium">Delivery</div>
          <div className="mt-2 text-sm text-muted-foreground">{order.customer_address}</div>
          <div className="mt-1 text-sm text-muted-foreground">{order.customer_district}</div>
          {order.special_instructions ? (
            <div className="mt-3 rounded border bg-muted/30 p-3 text-sm">
              <div className="font-medium">Special instructions</div>
              <div className="mt-1 text-muted-foreground">{order.special_instructions}</div>
            </div>
          ) : null}
        </div>

        <div className="rounded border p-4">
          <div className="text-sm font-medium">Payment</div>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Method</dt>
              <dd className="capitalize">{order.payment_method}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{order.payment_status}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Payment ID</dt>
              <dd className="truncate">{order.payment_id ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold">৳{order.total_amount}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded border">
        <div className="border-b p-4">
          <div className="text-sm font-medium">Items</div>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{i.product_name}</span>
                      <span className="text-xs text-muted-foreground">{i.product_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {i.size !== "Default" || i.color !== "Default" ? `${i.size} · ${i.color}` : "—"}
                  </TableCell>
                  <TableCell>{i.quantity}</TableCell>
                  <TableCell className="text-right">৳{i.subtotal}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No order items found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
