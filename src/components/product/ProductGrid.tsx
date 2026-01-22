import type { ProductSummary } from "@/types";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return <p>No products found</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="rounded border bg-white p-4">
          <p className="font-medium">{product.name}</p>
          <p className="mt-1 text-sm text-gray-700">৳{product.price}</p>
        </div>
      ))}
    </div>
  );
}
