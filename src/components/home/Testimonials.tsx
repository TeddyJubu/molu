import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ayesha R.",
    note: "Verified Buyer",
    rating: 5,
    quote: "The fabric feels premium and the fit is perfect. My son refuses to take it off."
  },
  {
    name: "Nafisa S.",
    note: "Verified Buyer",
    rating: 5,
    quote: "Fast delivery and the colors look even better in person. Great quality for the price."
  },
  {
    name: "Rahim K.",
    note: "Verified Buyer",
    rating: 4,
    quote: "Sizing guide was accurate and the stitching is solid. Will order again."
  }
];

export function Testimonials() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <h2 className="font-baloo text-3xl font-bold text-primary md:text-4xl">Loved by Parents</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Real feedback from families who shop Molu Kids.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name} className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={
                        idx < t.rating ? "h-4 w-4 fill-current" : "h-4 w-4 text-muted-foreground"
                      }
                    />
                  ))}
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {t.note}
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground">“{t.quote}”</p>
              <p className="mt-4 text-sm font-medium text-muted-foreground">{t.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
