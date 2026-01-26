import Link from "next/link";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asErrorMessage } from "@/lib/api/errors";
import { Order } from "@/types";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Badge } from "@/components/ui/badge";
import { RetryButton } from "@/components/admin/RetryButton";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const payment = Array.isArray(params.payment) ? params.payment[0] : params.payment;
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const dir = Array.isArray(params.dir) ? params.dir[0] : params.dir;

  if (!isNocoConfigured()) {
    return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">NocoDB is not configured.</div>;
  }

  let orders: Order[] = [];
  let error: string | null = null;

  try {
    const nocodb = new NocoDBClient();
    orders = await nocodb.listOrders({
      page: 1,
      pageSize: 100,
      order_status: status,
      payment_status: payment
    });
  } catch (e) {
    error = asErrorMessage(e);
  }

  const normalizedStatus = (status ?? "").trim().toLowerCase();
  const normalizedPayment = (payment ?? "").trim().toLowerCase();
  if (normalizedStatus) orders = orders.filter((o) => (o.order_status ?? "").toLowerCase() === normalizedStatus);
  if (normalizedPayment) orders = orders.filter((o) => (o.payment_status ?? "").toLowerCase() === normalizedPayment);

  const normalizedSort = String(sort ?? "created_at").trim();
  const normalizedDir = String(dir ?? "desc").trim().toLowerCase() === "asc" ? "asc" : "desc";
  const direction = normalizedDir === "asc" ? 1 : -1;
  const dateValue = (raw?: string) => {
    const d = raw ? new Date(raw) : null;
    const t = d ? d.getTime() : NaN;
    return Number.isFinite(t) ? t : 0;
  };

  orders = orders
    .slice()
    .sort((a, b) => {
      if (normalizedSort === "total_amount") return (Number(a.total_amount ?? 0) - Number(b.total_amount ?? 0)) * direction;
      if (normalizedSort === "order_status") return String(a.order_status ?? "").localeCompare(String(b.order_status ?? "")) * direction;
      return (dateValue(a.created_at) - dateValue(b.created_at)) * direction;
    });

  const sortHref = (field: string) => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (payment) sp.set("payment", payment);
    const nextDir = normalizedSort === field ? (normalizedDir === "asc" ? "desc" : "asc") : "desc";
    sp.set("sort", field);
    sp.set("dir", nextDir);
    const suffix = sp.toString();
    return suffix ? `/admin/orders?${suffix}` : "/admin/orders";
  };

  const sortLabel = (field: string, label: string) => {
    const active = normalizedSort === field;
    const glyph = active ? (normalizedDir === "asc" ? "↑" : "↓") : "";
    return (
      <Link href={sortHref(field)} className="inline-flex items-center gap-1">
        {label}
        <span className="text-xs text-muted-foreground">{glyph}</span>
      </Link>
    );
  };

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

  return (
    <main className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">Update status and open order details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All" href="/admin/orders" active={!status && !payment} />
          <FilterChip label="Pending" href="/admin/orders?status=pending" active={status === "pending"} />
          <FilterChip label="Confirmed" href="/admin/orders?status=confirmed" active={status === "confirmed"} />
          <FilterChip label="Paid" href="/admin/orders?payment=completed" active={payment === "completed"} />
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Failed to load orders</p>
          <p>{error}</p>
          <div className="mt-3">
            <RetryButton />
          </div>
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {orders.map((o) => (
          <div key={o.id} className="rounded border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Link href={`/admin/orders/${o.id}`} className="text-sm font-medium underline">
                  {o.id}
                </Link>
                <div className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</div>
              </div>
              {orderStatusBadge(o.order_status)}
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-medium">{o.customer_name}</div>
              <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
              <div className="text-xs text-muted-foreground">{o.customer_email}</div>
              {o.customer_district ? <div className="text-xs text-muted-foreground">{o.customer_district}</div> : null}
              <div className="flex items-center justify-between pt-1">
                <div className="font-medium">৳{o.total_amount}</div>
                {paymentStatusBadge(o.payment_status)}
              </div>
              <div className="pt-2">
                <OrderStatusSelect orderId={o.id} currentStatus={o.order_status} />
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No orders found.</div> : null}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>{sortLabel("created_at", "Ordered")}</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>{sortLabel("total_amount", "Total")}</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>{sortLabel("order_status", "Status")}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-2 underline">
                    <Badge variant="secondary">{o.id}</Badge>
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDateTime(o.created_at)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{o.customer_name}</span>
                    <span className="text-xs text-muted-foreground">{o.customer_phone}</span>
                    <span className="text-xs text-muted-foreground">{o.customer_email}</span>
                    {o.customer_district ? <span className="text-xs text-muted-foreground">{o.customer_district}</span> : null}
                  </div>
                </TableCell>
                <TableCell>৳{o.total_amount}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {paymentStatusBadge(o.payment_status)}
                    <span className={`text-xs ${o.payment_method ? "text-muted-foreground capitalize" : "text-muted-foreground"}`}>
                      {o.payment_method ? o.payment_method : "Not set"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{orderStatusBadge(o.order_status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <OrderStatusSelect orderId={o.id} currentStatus={o.order_status} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded border px-3 py-1 text-sm ${active ? "bg-muted font-medium" : "hover:bg-muted"}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
