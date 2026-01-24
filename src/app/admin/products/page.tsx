import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asErrorMessage } from "@/lib/api/errors";
import { CreateProductButton, EditProductButton, DeleteProductButton } from "@/components/admin/product-actions";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!isNocoConfigured()) {
    return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">NocoDB is not configured.</div>;
  }

  let products: Product[] = [];
  let featuredById: Map<string, string> = new Map();
  let error: string | null = null;

  try {
    const nocodb = new NocoDBClient();
    products = await nocodb.listProductsAdmin({ page: 1, pageSize: 200 });
    featuredById = await nocodb.listFeaturedImages(products.map((p) => p.id));
  } catch (e) {
    error = asErrorMessage(e);
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">Manage your store products.</p>
        </div>
        <CreateProductButton />
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Failed to load products</p>
          <p>{error}</p>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                {featuredById.get(p.id) ? (
                  <img
                    src={featuredById.get(p.id)}
                    alt={`${p.name} featured`}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">{p.id}</TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.brand}</span>
                </div>
              </TableCell>
              <TableCell>৳{p.price}</TableCell>
              <TableCell>
                {p.is_active ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-500">Inactive</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <EditProductButton product={p} />
                  <DeleteProductButton productId={p.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </main>
  );
}
