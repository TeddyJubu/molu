import Link from "next/link";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asErrorMessage } from "@/lib/api/errors";
import { Order, OrderItem } from "@/types";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isNocoConfigured()) {
    return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">NocoDB is not configured.</div>;
  }

  let order: Order | null = null;
  let items: OrderItem[] = [];
  let events: Array<{ id: string; order_id: string; status: string; note?: string | null; created_at?: string }> = [];
  let error: string | null = null;
  let itemsError: string | null = null;

  try {
    const nocodb = new NocoDBClient();
    order = await nocodb.getOrder(id);
    const maybeListOrderEvents = (nocodb as any).listOrderEvents;
    events = typeof maybeListOrderEvents === "function" ? await maybeListOrderEvents.call(nocodb, id).catch(() => []) : [];
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

  try {
    const nocodb = new NocoDBClient();
    items = await nocodb.listOrderItems(id);
  } catch (e) {
    itemsError = asErrorMessage(e);
    items = [];
  }

  const formatDateTime = (raw?: string) => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  };

  const orderStatusBadge = (value?: string) => {
    const v = String(value ?? "").toLowerCase();
    if (v === "pending") return <Badge className="bg-red-50 text-red-700 border border-red-200">Pending</Badge>;
    if (v === "confirmed") return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Confirmed</Badge>;
    if (v === "shipped") return <Badge className="bg-purple-50 text-purple-700 border border-purple-200">Shipped</Badge>;
    if (v === "delivered") return <Badge className="bg-green-50 text-green-700 border border-green-200">Delivered</Badge>;
    if (v === "cancelled") return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">Cancelled</Badge>;
    return <Badge variant="outline" className="capitalize">{v || "—"}</Badge>;
  };

  const paymentStatusBadge = (value?: string) => {
    const v = String(value ?? "").toLowerCase();
    if (v === "completed") return <Badge className="bg-green-50 text-green-700 border border-green-200">Completed</Badge>;
    if (v === "pending") return <Badge className="bg-amber-50 text-amber-800 border border-amber-200">Pending</Badge>;
    if (v === "failed") return <Badge className="bg-red-50 text-red-700 border border-red-200">Failed</Badge>;
    return <Badge variant="outline" className="capitalize">{v || "—"}</Badge>;
  };

  const timelineEvents =
    events.length > 0
      ? events
      : ([
          ...(order.created_at
            ? [{ id: "fallback-created", order_id: order.id, status: "pending", note: "Order created", created_at: order.created_at }]
            : []),
          ...(order.updated_at && order.updated_at !== order.created_at
            ? [{ id: "fallback-updated", order_id: order.id, status: order.order_status, note: "Last updated", created_at: order.updated_at }]
            : []),
          ...(!order.created_at && !order.updated_at
            ? [{ id: "fallback-status", order_id: order.id, status: order.order_status, note: "Current status", created_at: undefined }]
            : [])
        ] as Array<{ id: string; order_id: string; status: string; note?: string | null; created_at?: string }>);

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link href="/admin/orders" className="text-sm underline">
            Back to orders
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-muted-foreground">Order</div>
            <h2 className="text-xl font-semibold">{order.id}</h2>
            {orderStatusBadge(order.order_status)}
          </div>
          <div className="text-sm text-muted-foreground">Created {formatDateTime(order.created_at)}</div>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusSelect orderId={order.id} currentStatus={order.order_status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded border p-4">
          <div className="text-sm font-medium">Customer</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-right font-medium">{order.customer_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-right">{order.customer_phone}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-right">{order.customer_email}</dd>
            </div>
            <div className="pt-2">
              <div className="text-xs font-medium text-muted-foreground">Shipping address</div>
              <div className="mt-1 text-sm">{order.customer_address}</div>
              <div className="text-sm text-muted-foreground">{order.customer_district}</div>
            </div>
          </dl>
        </div>

        <div className="rounded border p-4">
          <div className="text-sm font-medium">Order</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ordered</dt>
              <dd className="text-right">{formatDateTime(order.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="text-right">{formatDateTime(order.updated_at)}</dd>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="text-right font-semibold">৳{order.total_amount}</dd>
            </div>
          </dl>
          {order.special_instructions ? (
            <div className="mt-4 rounded border bg-muted/30 p-3 text-sm">
              <div className="font-medium">Special instructions</div>
              <div className="mt-1 text-muted-foreground">{order.special_instructions}</div>
            </div>
          ) : null}
        </div>

        <div className="rounded border p-4">
          <div className="text-sm font-medium">Payment</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Method</dt>
              <dd className={order.payment_method ? "capitalize" : "text-muted-foreground"}>
                {order.payment_method ? order.payment_method : "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{paymentStatusBadge(order.payment_status)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Payment ID</dt>
              <dd className="truncate">{order.payment_id ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded border">
        <div className="border-b p-4">
          <div className="text-sm font-medium">Timeline</div>
        </div>
        <div className="p-4">
          {timelineEvents.length ? (
            <div className="space-y-3">
              {timelineEvents.map((event) => (
                <div key={event.id} className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    {orderStatusBadge(event.status)}
                    {event.note ? <span className="text-sm text-muted-foreground">{event.note}</span> : null}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDateTime(event.created_at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No timeline events yet.</div>
          )}
        </div>
      </div>

      <div className="rounded border">
        <div className="border-b p-4">
          <div className="text-sm font-medium">Items</div>
        </div>
        <div className="p-4">
          {itemsError ? (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Failed to load items: {itemsError}
            </div>
          ) : null}
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
