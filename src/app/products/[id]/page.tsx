import { notFound } from "next/navigation";
import { products } from "@/lib/demo-data";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  let related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  if (related.length < 4) {
    related = [
      ...related,
      ...products.filter((p) => p.id !== product.id && p.category !== product.category).slice(0, 4 - related.length)
    ];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      <ProductDetailView product={product} />

      {related.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div className="space-y-1">
              <h2 className="font-baloo text-2xl font-bold text-primary md:text-3xl">You might also like</h2>
              <p className="text-sm text-muted-foreground">More picks we think you’ll love.</p>
            </div>
            <Link href={`/products?category=${product.category}`} className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
