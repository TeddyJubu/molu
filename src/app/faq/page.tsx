import Link from "next/link";

const faqs = [
  { q: "How do I choose the right size?", a: "Each product includes an age range and sizing options. If you’re unsure, contact us for help." },
  { q: "How long does shipping take?", a: "Shipping times vary by location. We’ll share an estimate at checkout when available." },
  { q: "Can I return an item?", a: "Returns are accepted within the return window as long as items are unused and in original packaging." }
];

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-baloo text-3xl font-bold text-primary">FAQ</h1>
        <div className="space-y-4">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-lg border bg-card p-5">
              <p className="font-medium">{item.q}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Still need help?{" "}
          <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
