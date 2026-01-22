import Link from "next/link";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asErrorMessage } from "@/lib/api/errors";
import { setProductActiveAction } from "@/app/admin/_actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!isNocoConfigured()) {
    return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">NocoDB is not configured.</div>;
  }

  let products: { row_id: string; id: string; name: string; price: number; is_active?: boolean }[] = [];
  let error: string | null = null;

  try {
    const nocodb = new NocoDBClient();
    products = await nocodb.listProductsAdmin({ page: 1, pageSize: 200 });
  } catch (e) {
    error = asErrorMessage(e);
  }

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Products</h2>
        <p className="text-sm text-muted-foreground">Toggle active products to control what appears in the storefront.</p>
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
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.row_id}>
              <TableCell className="font-mono text-xs">
                <Link href={`/products/${p.id}`} className="underline">
                  {p.id}
                </Link>
              </TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>৳{p.price}</TableCell>
              <TableCell>{p.is_active ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                <form action={setProductActiveAction}>
                  <input type="hidden" name="productId" value={p.id} />
                  <label className="sr-only" htmlFor={`active-${p.id}`}>
                    Active
                  </label>
                  <div className="flex items-center justify-end gap-2">
                    <select
                      id={`active-${p.id}`}
                      name="is_active"
                      defaultValue={p.is_active ? "true" : "false"}
                      className="h-9 rounded border bg-background px-2 text-sm"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <Button type="submit" size="sm" variant="secondary">
                      Save
                    </Button>
                  </div>
                </form>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </main>
  );
}
