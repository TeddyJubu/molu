import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl space-y-4">
        <h1 className="font-baloo text-3xl font-bold text-primary">Contact</h1>
        <p className="text-muted-foreground">
          Need help with sizing, shipping, or an order? We’re happy to help.
        </p>
        <div className="rounded-lg border bg-card p-5 text-sm">
          <p className="font-medium">Email</p>
          <a className="text-primary underline-offset-4 hover:underline" href="mailto:support@molukids.com">
            support@molukids.com
          </a>
          <p className="mt-4 text-muted-foreground">
            We typically respond within 1–2 business days.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Want to keep shopping?{" "}
          <Link href="/products" className="text-primary underline-offset-4 hover:underline">
            Browse products
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
