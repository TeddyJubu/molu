import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TrendingProducts() {
  const trending = products.slice(0, 4);

  return (
    <section className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-baloo text-3xl font-bold text-primary md:text-4xl">
          Trending Now
        </h2>
        <Button asChild variant="outline">
          <Link href="/products">View All</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {trending.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
