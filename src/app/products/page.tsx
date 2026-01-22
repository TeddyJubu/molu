import Link from "next/link";
import { products, categories } from "@/lib/demo-data";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category: categoryFilter } = await searchParams;

  const filteredProducts = categoryFilter
    ? products.filter((p) => p.category === categoryFilter)
    : products;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-baloo text-3xl font-bold text-primary">All Products</h1>
        <div className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} results
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              <Link href="/products" className={`block text-sm ${!categoryFilter ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                All Categories
              </Link>
              {categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/products?category=${cat.id}`}
                  className={`block text-sm ${categoryFilter === cat.id ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {cat.name} ({cat.count})
                </Link>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-semibold mb-4">Price Range</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="price-1" />
                <Label htmlFor="price-1">Under ৳500</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="price-2" />
                <Label htmlFor="price-2">৳500 - ৳1000</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="price-3" />
                <Label htmlFor="price-3">৳1000 - ৳2000</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="price-4" />
                <Label htmlFor="price-4">Over ৳2000</Label>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-muted-foreground">Try adjusting your filters.</p>
              <Button asChild variant="link" className="mt-4">
                <Link href="/products">Clear filters</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
