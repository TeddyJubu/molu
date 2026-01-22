import { notFound } from "next/navigation";
import { products } from "@/lib/demo-data";
import { ProductDetailView } from "@/components/product/ProductDetailView";
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
    </div>
  );
}
