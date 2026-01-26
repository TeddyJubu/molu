import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { asErrorMessage } from "@/lib/api/errors";
import { CreateProductButton } from "@/components/admin/product-actions";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { RetryButton } from "@/components/admin/RetryButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const params = (await searchParams) ?? {};
  const query = (Array.isArray(params.query) ? params.query[0] : params.query) ?? "";
  const status = (Array.isArray(params.status) ? params.status[0] : params.status) ?? "";
  const hideTestRaw = (Array.isArray(params.hide_test) ? params.hide_test[0] : params.hide_test) ?? "";
  const hideTest = hideTestRaw === "1" || hideTestRaw.toLowerCase() === "true";
  const pageRaw = (Array.isArray(params.page) ? params.page[0] : params.page) ?? "1";
  const pageSizeRaw = (Array.isArray(params.pageSize) ? params.pageSize[0] : params.pageSize) ?? "10";
  const sort = (Array.isArray(params.sort) ? params.sort[0] : params.sort) ?? "name";
  const dir = (Array.isArray(params.dir) ? params.dir[0] : params.dir) ?? "asc";
  const pageSize = Math.max(5, Math.min(50, Number(pageSizeRaw) || 10));
  const page = Math.max(1, Number(pageRaw) || 1);

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

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedStatus = status.trim().toLowerCase();
  const normalizedSort = sort.trim().toLowerCase();
  const normalizedDir = dir.trim().toLowerCase() === "desc" ? "desc" : "asc";
  const direction = normalizedDir === "asc" ? 1 : -1;
  const filtered = products.filter((p) => {
    if (normalizedStatus === "active" && !p.is_active) return false;
    if (normalizedStatus === "inactive" && p.is_active) return false;
    if (hideTest) {
      const n = String(p.name ?? "").trim().toLowerCase();
      if (n.startsWith("test")) return false;
    }
    if (!normalizedQuery) return true;
    const hay = `${p.id} ${p.name ?? ""} ${p.brand ?? ""}`.toLowerCase();
    return hay.includes(normalizedQuery);
  });

  const sorted = filtered.slice().sort((a, b) => {
    if (normalizedSort === "price") return (Number(a.price ?? 0) - Number(b.price ?? 0)) * direction;
    if (normalizedSort === "status") return (Number(Boolean(a.is_active)) - Number(Boolean(b.is_active))) * direction;
    if (normalizedSort === "id") return String(a.id).localeCompare(String(b.id)) * direction;
    return String(a.name ?? "").localeCompare(String(b.name ?? "")) * direction;
  });

  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalFiltered ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(totalFiltered, startIndex + pageSize);
  const paged = sorted.slice(startIndex, endIndex);

  const buildHref = (next: { query?: string; status?: string; hideTest?: boolean; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    const nextQuery = (next.query ?? query).trim();
    const nextStatus = (next.status ?? status).trim();
    const nextHideTest = next.hideTest ?? hideTest;
    const nextPageSize = next.pageSize ?? pageSize;
    const nextPage = next.page ?? 1;
    if (nextQuery) sp.set("query", nextQuery);
    if (nextStatus) sp.set("status", nextStatus);
    if (nextHideTest) sp.set("hide_test", "1");
    if (nextPage > 1) sp.set("page", String(nextPage));
    if (nextPageSize !== 10) sp.set("pageSize", String(nextPageSize));
    if (normalizedSort && normalizedSort !== "name") sp.set("sort", normalizedSort);
    if (normalizedDir && normalizedDir !== "asc") sp.set("dir", normalizedDir);
    const suffix = sp.toString();
    return suffix ? `/admin/products?${suffix}` : "/admin/products";
  };

  const sortHref = (field: string) => {
    const sp = new URLSearchParams();
    const nextDir = normalizedSort === field ? (normalizedDir === "asc" ? "desc" : "asc") : field === "price" ? "desc" : "asc";
    const nextPage = 1;
    const nextPageSize = pageSize;
    const nextQuery = query.trim();
    const nextStatus = status.trim();
    if (nextQuery) sp.set("query", nextQuery);
    if (nextStatus) sp.set("status", nextStatus);
    if (hideTest) sp.set("hide_test", "1");
    if (nextPageSize !== 10) sp.set("pageSize", String(nextPageSize));
    if (field !== "name") sp.set("sort", field);
    if (nextDir !== "asc") sp.set("dir", nextDir);
    const suffix = sp.toString();
    return suffix ? `/admin/products?${suffix}` : "/admin/products";
  };

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">Manage your store products.</p>
        </div>
        <CreateProductButton />
      </div>

      <div className="flex flex-col gap-3 rounded border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/products" method="GET" className="flex flex-1 items-center gap-2">
          <Input name="query" defaultValue={query} placeholder="Search products by name, brand, or ID…" className="h-9" />
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {hideTest ? <input type="hidden" name="hide_test" value="1" /> : null}
          {currentPage > 1 ? <input type="hidden" name="page" value={String(currentPage)} /> : null}
          {pageSize !== 10 ? <input type="hidden" name="pageSize" value={String(pageSize)} /> : null}
          {normalizedSort && normalizedSort !== "name" ? <input type="hidden" name="sort" value={normalizedSort} /> : null}
          {normalizedDir && normalizedDir !== "asc" ? <input type="hidden" name="dir" value={normalizedDir} /> : null}
          <Button type="submit" variant="secondary" className="h-9">
            Search
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildHref({ status: "", page: 1 })}
            className={`rounded border px-3 py-1 text-sm ${!normalizedStatus ? "bg-muted font-medium" : "hover:bg-muted"}`}
            aria-current={!normalizedStatus ? "page" : undefined}
          >
            All
          </Link>
          <Link
            href={buildHref({ status: "active", page: 1 })}
            className={`rounded border px-3 py-1 text-sm ${normalizedStatus === "active" ? "bg-muted font-medium" : "hover:bg-muted"}`}
            aria-current={normalizedStatus === "active" ? "page" : undefined}
          >
            Active only
          </Link>
          <Link
            href={buildHref({ status: "inactive", page: 1 })}
            className={`rounded border px-3 py-1 text-sm ${normalizedStatus === "inactive" ? "bg-muted font-medium" : "hover:bg-muted"}`}
            aria-current={normalizedStatus === "inactive" ? "page" : undefined}
          >
            Inactive only
          </Link>
          <Link
            href={buildHref({ hideTest: !hideTest, page: 1 })}
            className={`rounded border px-3 py-1 text-sm ${hideTest ? "bg-muted font-medium" : "hover:bg-muted"}`}
            aria-current={hideTest ? "page" : undefined}
          >
            {hideTest ? "Test hidden" : "Hide test"}
          </Link>
          <Link
            href={sortHref("name")}
            className={`rounded border px-3 py-1 text-sm ${normalizedSort === "name" ? "bg-muted font-medium" : "hover:bg-muted"}`}
          >
            Sort: Name {normalizedSort === "name" ? (normalizedDir === "asc" ? "↑" : "↓") : ""}
          </Link>
          <Link
            href={sortHref("price")}
            className={`rounded border px-3 py-1 text-sm ${normalizedSort === "price" ? "bg-muted font-medium" : "hover:bg-muted"}`}
          >
            Price {normalizedSort === "price" ? (normalizedDir === "asc" ? "↑" : "↓") : ""}
          </Link>
          <Link
            href={sortHref("status")}
            className={`rounded border px-3 py-1 text-sm ${normalizedSort === "status" ? "bg-muted font-medium" : "hover:bg-muted"}`}
          >
            Status {normalizedSort === "status" ? (normalizedDir === "asc" ? "↑" : "↓") : ""}
          </Link>
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {totalFiltered ? startIndex + 1 : 0}–{endIndex}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalFiltered}</span> filtered ·{" "}
            <span className="font-medium text-foreground">{products.length}</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Failed to load products</p>
          <p>{error}</p>
          <div className="mt-3">
            <RetryButton />
          </div>
        </div>
      ) : null}

      <AdminProductsTable products={paged} featuredById={Object.fromEntries(featuredById.entries())} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-9" disabled={currentPage <= 1}>
            <Link href={buildHref({ page: Math.max(1, currentPage - 1) })} aria-disabled={currentPage <= 1}>
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-9" disabled={currentPage >= totalPages}>
            <Link
              href={buildHref({ page: Math.min(totalPages, currentPage + 1) })}
              aria-disabled={currentPage >= totalPages}
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
