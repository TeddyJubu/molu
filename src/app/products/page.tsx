import Link from "next/link";
import { products, categories } from "@/lib/demo-data";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductsSearchBar } from "@/components/product/ProductsSearchBar";
import { ChevronRight } from "lucide-react";

interface ProductsPageProps {
  searchParams?: Promise<{
    category?: string | string[];
    query?: string | string[];
    price?: string | string[];
    size?: string | string[];
    color?: string | string[];
  }>;
}

function paramValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (searchParams ? await searchParams : {}) ?? {};
  const categoryFilter = paramValue(params.category).trim();
  const queryValue = paramValue(params.query);
  const priceFilter = paramValue(params.price).trim().toLowerCase();
  const sizeFilter = paramValue(params.size).trim();
  const colorFilter = paramValue(params.color).trim();

  const normalizedQuery = queryValue.trim().toLowerCase();
  const matchesPrice = (value: number) => {
    if (!priceFilter) return true;
    if (priceFilter === "under-500") return value < 500;
    if (priceFilter === "500-1000") return value >= 500 && value <= 1000;
    if (priceFilter === "1000-2000") return value >= 1000 && value <= 2000;
    if (priceFilter === "over-2000") return value > 2000;
    return true;
  };

  const filteredProducts = (categoryFilter
    ? products.filter((p) => p.category === categoryFilter)
    : products)
    .filter((p) => matchesPrice(p.price))
    .filter((p) => (sizeFilter ? p.sizes.includes(sizeFilter) : true))
    .filter((p) => (colorFilter ? p.colors.includes(colorFilter) : true))
    .filter((p) => {
      if (!normalizedQuery) return true;
      const haystack = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes))).sort((a, b) => a.localeCompare(b));
  const colors = Array.from(new Set(products.flatMap((p) => p.colors))).sort((a, b) => a.localeCompare(b));
  const activeCategoryName = categoryFilter ? categories.find((c) => c.id === categoryFilter)?.name : undefined;
  const buildHref = (next: {
    category?: string;
    query?: string;
    price?: string;
    size?: string;
    color?: string;
  }) => {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.query) params.set("query", next.query);
    if (next.price) params.set("price", next.price);
    if (next.size) params.set("size", next.size);
    if (next.color) params.set("color", next.color);
    const suffix = params.toString();
    return suffix ? `/products?${suffix}` : "/products";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-primary transition-colors">
          Products
        </Link>
        {activeCategoryName ? (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{activeCategoryName}</span>
          </>
        ) : null}
      </nav>
      <ProductsSearchBar placeholder="Search products (e.g., blue hoodie)…" />
      {(categoryFilter || normalizedQuery || priceFilter || sizeFilter || colorFilter) ? (
        <Button asChild variant="ghost" className="-mt-4 mb-6">
          <Link href="/products">Clear filters</Link>
        </Button>
      ) : null}
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
              <Link
                href={buildHref({
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(priceFilter ? { price: priceFilter } : {}),
                  ...(sizeFilter ? { size: sizeFilter } : {}),
                  ...(colorFilter ? { color: colorFilter } : {})
                })}
                className={`block text-sm ${!categoryFilter ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                All Categories
              </Link>
              {categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  href={buildHref({
                    category: cat.id,
                    ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                    ...(priceFilter ? { price: priceFilter } : {}),
                    ...(sizeFilter ? { size: sizeFilter } : {}),
                    ...(colorFilter ? { color: colorFilter } : {})
                  })}
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
            <div className="space-y-2 text-sm">
              <Link
                href={buildHref({
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(sizeFilter ? { size: sizeFilter } : {}),
                  ...(colorFilter ? { color: colorFilter } : {})
                })}
                className={`block ${!priceFilter ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                All Prices
              </Link>
              <Link
                href={buildHref({
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(sizeFilter ? { size: sizeFilter } : {}),
                  ...(colorFilter ? { color: colorFilter } : {}),
                  price: "under-500"
                })}
                className={`block ${priceFilter === "under-500" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Under ৳500
              </Link>
              <Link
                href={buildHref({
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(sizeFilter ? { size: sizeFilter } : {}),
                  ...(colorFilter ? { color: colorFilter } : {}),
                  price: "500-1000"
                })}
                className={`block ${priceFilter === "500-1000" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                ৳500 - ৳1000
              </Link>
              <Link
                href={buildHref({
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(sizeFilter ? { size: sizeFilter } : {}),
                  ...(colorFilter ? { color: colorFilter } : {}),
                  price: "1000-2000"
                })}
                className={`block ${priceFilter === "1000-2000" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                ৳1000 - ৳2000
              </Link>
              <Link
                href={buildHref({
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(sizeFilter ? { size: sizeFilter } : {}),
                  ...(colorFilter ? { color: colorFilter } : {}),
                  price: "over-2000"
                })}
                className={`block ${priceFilter === "over-2000" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Over ৳2000
              </Link>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Age Range</h3>
            <div className="space-y-2 text-sm">
              <Link
                href={buildHref({
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(priceFilter ? { price: priceFilter } : {}),
                  ...(colorFilter ? { color: colorFilter } : {})
                })}
                className={`block ${!sizeFilter ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                All Sizes
              </Link>
              {sizes.map((s) => (
                <Link
                  key={s}
                  href={buildHref({
                    ...(categoryFilter ? { category: categoryFilter } : {}),
                    ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                    ...(priceFilter ? { price: priceFilter } : {}),
                    ...(colorFilter ? { color: colorFilter } : {}),
                    size: s
                  })}
                  className={`block ${sizeFilter === s ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Color</h3>
            <div className="space-y-2 text-sm">
              <Link
                href={buildHref({
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                  ...(priceFilter ? { price: priceFilter } : {}),
                  ...(sizeFilter ? { size: sizeFilter } : {})
                })}
                className={`block ${!colorFilter ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                All Colors
              </Link>
              {colors.map((c) => (
                <Link
                  key={c}
                  href={buildHref({
                    ...(categoryFilter ? { category: categoryFilter } : {}),
                    ...(normalizedQuery ? { query: queryValue.trim() } : {}),
                    ...(priceFilter ? { price: priceFilter } : {}),
                    ...(sizeFilter ? { size: sizeFilter } : {}),
                    color: c
                  })}
                  className={`block ${colorFilter === c ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} showDescription />
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
