import Link from "next/link";
import { notFound } from "next/navigation";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { NotFoundError } from "@/lib/api/errors";
import { OrderPaymentStatus } from "@/components/order/OrderPaymentStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isNocoConfigured()) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="font-baloo text-3xl font-bold text-primary">Order {id}</h1>
        <p className="mt-3 text-muted-foreground">
          We can’t load order details right now. Please try again later.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link href="/products">Shop products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </main>
    );
  }

  try {
    const nocodb = new NocoDBClient();
    const [order, items] = await Promise.all([nocodb.getOrder(id), nocodb.listOrderItems(id)]);

    return (
      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="font-baloo text-3xl font-bold text-primary">Thanks! Your order is placed.</h1>
          <p className="text-sm text-muted-foreground">
            Order ID: <span className="font-medium text-foreground">{order.id}</span>
          </p>
        </div>

        <OrderPaymentStatus
          orderId={order.id}
          paymentStatus={order.payment_status}
          paymentMethod={order.payment_method}
          totalAmount={order.total_amount}
        />

        <Card>
          <CardHeader>
            <CardTitle>Delivery details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">District</p>
                <p className="font-medium">{order.customer_district}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium whitespace-pre-line">{order.customer_address}</p>
            </div>
            {order.special_instructions ? (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Special instructions</p>
                  <p className="font-medium whitespace-pre-line">{order.special_instructions}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.product_name}</p>
                    <p className="text-muted-foreground">
                      {item.size !== "Default" || item.color !== "Default" ? `${item.size} · ${item.color} · ` : ""}x{item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">৳{item.subtotal}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">৳{order.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/products">Continue shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/cart">View cart</Link>
          </Button>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="font-baloo text-3xl font-bold text-primary">Order {id}</h1>
        <p className="mt-3 text-muted-foreground">We could not load this order right now. Please try again.</p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link href="/products">Shop products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </main>
    );
  }
}
