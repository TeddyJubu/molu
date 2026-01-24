import Link from "next/link";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { asErrorMessage } from "@/lib/api/errors";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
 
export const dynamic = "force-dynamic";
 
interface PageProps {
  params: Promise<{ id: string }>;
}
 
export default async function AdminProductEditPage({ params }: PageProps) {
  const { id } = await params;
 
  if (!isNocoConfigured()) {
    return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">NocoDB is not configured.</div>;
  }
 
  try {
    const nocodb = new NocoDBClient();
    const product = await nocodb.getProductById(id);
 
    return (
      <main className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Edit Product</h2>
            <p className="text-sm text-muted-foreground">Manage product details, attributes, and variants.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/products">Back to products</Link>
          </Button>
        </div>
 
        <div className="rounded border p-4">
          <ProductForm
            defaultValues={{
              id: String(product.id ?? ""),
              name: String(product.name ?? ""),
              price: String(product.price ?? 0),
              description: product.description ?? "",
              brand: product.brand ?? ""
            }}
          />
        </div>
      </main>
    );
  } catch (e) {
    const error = asErrorMessage(e);
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-semibold">Failed to load product</p>
        <p>{error}</p>
        <div className="mt-3">
          <Button asChild variant="outline">
            <Link href="/admin/products">Back to products</Link>
          </Button>
        </div>
      </div>
    );
  }
}
