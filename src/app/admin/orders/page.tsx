import Link from "next/link";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asErrorMessage } from "@/lib/api/errors";
import { Order } from "@/types";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const payment = Array.isArray(params.payment) ? params.payment[0] : params.payment;

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
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">
                <Link href={`/admin/orders/${o.id}`} className="underline">
                  {o.id}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{o.customer_name}</span>
                  <span className="text-xs text-muted-foreground">{o.customer_phone}</span>
                </div>
              </TableCell>
              <TableCell>৳{o.total_amount}</TableCell>
              <TableCell className="capitalize">{o.payment_status}</TableCell>
              <TableCell className="capitalize">{o.order_status}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <OrderStatusSelect orderId={o.id} currentStatus={o.order_status} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
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
