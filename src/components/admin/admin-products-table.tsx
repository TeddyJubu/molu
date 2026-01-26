"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Product } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { bulkSetProductsActiveAction, getProductsStockSummaryAction } from "@/app/admin/_actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DeleteProductButton, EditProductButton } from "@/components/admin/product-actions";
import { useRouter } from "next/navigation";

type BulkAction = "activate" | "deactivate";

export function AdminProductsTable({
  products,
  featuredById
}: {
  products: Product[];
  featuredById: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const [stockById, setStockById] = useState<Record<string, { total: number | null; low: boolean }>>({});

  const productIdsOnPage = useMemo(() => products.map((p) => p.id), [products]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = productIdsOnPage.length > 0 && productIdsOnPage.every((id) => selectedSet.has(id));

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !productIdsOnPage.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...productIdsOnPage])));
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const selectedOnPage = selectedIds.filter((id) => productIdsOnPage.includes(id));

  useEffect(() => {
    let cancelled = false;
    setStockById((prev) => {
      const next = { ...prev };
      for (const id of productIdsOnPage) {
        if (!(id in next)) next[id] = { total: null, low: false };
      }
      return next;
    });
    const formData = new FormData();
    formData.set("productIds", JSON.stringify(productIdsOnPage));
    getProductsStockSummaryAction(formData)
      .then((result) => {
        if (cancelled) return;
        setStockById((prev) => ({ ...prev, ...(result ?? {}) }));
      })
      .catch(() => {
        if (!cancelled) setStockById((prev) => prev);
      });
    return () => {
      cancelled = true;
    };
  }, [productIdsOnPage]);

  const applyBulk = (action: BulkAction) => {
    const isActive = action === "activate";
    const ids = selectedOnPage;
    if (!ids.length) return;

    const formData = new FormData();
    formData.set("productIds", JSON.stringify(ids));
    formData.set("is_active", String(isActive));

    startTransition(() => {
      bulkSetProductsActiveAction(formData)
        .then(() => {
          toast.success(isActive ? "Products marked active" : "Products marked inactive");
          setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
          router.refresh();
        })
        .catch(() => toast.error("Failed to update products"));
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-muted/20 p-3">
        <div className="text-sm">
          <span className="font-medium">{selectedOnPage.length}</span> selected on this page
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9"
            disabled={isPending || selectedOnPage.length === 0}
            onClick={() => setConfirmAction("activate")}
          >
            Mark Active
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            disabled={isPending || selectedOnPage.length === 0}
            onClick={() => setConfirmAction("deactivate")}
          >
            Mark Inactive
          </Button>
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="rounded border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedSet.has(p.id)}
                  onCheckedChange={(v) => toggleOne(p.id, Boolean(v))}
                  aria-label={`Select ${p.name}`}
                />
                <div className="flex items-start gap-3">
                  {featuredById[p.id] ? (
                    <img src={featuredById[p.id]} alt={`${p.name} featured`} className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.brand}</div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">{p.id}</div>
                  </div>
                </div>
              </div>
              {p.is_active ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm font-medium">৳{p.price}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {stockById[p.id]?.total === null || stockById[p.id]?.total === undefined ? "…" : stockById[p.id]?.total}
                </span>
                {stockById[p.id]?.low ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border border-amber-200">
                    Low
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <EditProductButton product={p} />
              <DeleteProductButton productId={p.id} />
            </div>
          </div>
        ))}
        {products.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No products found.</div> : null}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} aria-label="Select all products" />
              </TableHead>
              <TableHead>Image</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} data-state={selectedSet.has(p.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selectedSet.has(p.id)}
                    onCheckedChange={(v) => toggleOne(p.id, Boolean(v))}
                    aria-label={`Select ${p.name}`}
                  />
                </TableCell>
                <TableCell>
                  {featuredById[p.id] ? (
                    <img src={featuredById[p.id]} alt={`${p.name} featured`} className="h-10 w-10 rounded object-cover" />
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {stockById[p.id]?.total === null || stockById[p.id]?.total === undefined ? "…" : stockById[p.id]?.total}
                    </span>
                    {stockById[p.id]?.low ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border border-amber-200">
                        Low
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {p.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500">
                      Inactive
                    </Badge>
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
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => (!open ? setConfirmAction(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update selected products?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "activate"
                ? "Selected products will become visible in the storefront."
                : "Selected products will be hidden from the storefront."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={() => setConfirmAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirmAction) return;
                const action = confirmAction;
                setConfirmAction(null);
                applyBulk(action);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
