import Link from "next/link";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { asErrorMessage } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isNocoConfigured();
  let counts = null;
  let error = null;

  if (configured) {
    try {
      const nocodb = new NocoDBClient();
      const orders = await nocodb.listOrders({ page: 1, pageSize: 200 });
      const pending = orders.filter((o) => o.order_status === "pending").length;
      const confirmed = orders.filter((o) => o.order_status === "confirmed").length;
      const paid = orders.filter((o) => o.payment_status === "completed").length;
      counts = { total: orders.length, pending, confirmed, paid };
    } catch (e) {
      error = asErrorMessage(e);
    }
  }

  return (
    <main className="space-y-6">
      {!configured ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, and NOCODB_PROJECT_ID to enable admin tools.
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Failed to load admin data</p>
          <p>{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border p-4">
          <div className="text-sm text-muted-foreground">Orders</div>
          <div className="mt-2 text-2xl font-bold">{counts ? counts.total : <span className="text-muted-foreground">—</span>}</div>
          <div className="mt-3">
            <Link href="/admin/orders" className="text-sm underline">
              Manage orders
            </Link>
          </div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="mt-2 text-2xl font-bold">{counts ? counts.pending : <span className="text-muted-foreground">—</span>}</div>
          <div className="mt-3 text-sm text-muted-foreground">Needs confirmation or payment follow-up.</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-muted-foreground">Paid</div>
          <div className="mt-2 text-2xl font-bold">{counts ? counts.paid : <span className="text-muted-foreground">—</span>}</div>
          <div className="mt-3 text-sm text-muted-foreground">Payments completed.</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/orders" className="rounded border p-4 hover:bg-muted">
          <div className="text-base font-semibold">Orders</div>
          <div className="mt-1 text-sm text-muted-foreground">Review and update order status.</div>
        </Link>
        <Link href="/admin/products" className="rounded border p-4 hover:bg-muted">
          <div className="text-base font-semibold">Products</div>
          <div className="mt-1 text-sm text-muted-foreground">Toggle active products for the storefront.</div>
        </Link>
      </div>
    </main>
  );
}
