import Link from "next/link";

export default function ShippingReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-baloo text-3xl font-bold text-primary">Shipping & Returns</h1>
        <p className="text-muted-foreground">
          Replace this content with your official shipping timelines, delivery areas, and return rules before launch.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-5">
            <p className="font-medium">Shipping</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Order processing: 1–2 business days</li>
              <li>Delivery: varies by location</li>
              <li>Tracking: provided when available</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="font-medium">Returns</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Return window: 7–14 days (example)</li>
              <li>Items must be unused and in original packaging</li>
              <li>Refunds processed back to original payment method</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Questions?{" "}
          <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
            Contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
