"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ProductForm } from "./product-form";
import { Plus, Pencil, Trash2, Maximize2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/app/admin/_actions";
import type { Product } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function toFormValues(product: Product) {
  return {
    id: String(product.id ?? ""),
    name: String(product.name ?? ""),
    price: String(product.price ?? "0"),
    description: product.description ?? "",
    brand: product.brand ?? ""
  };
}

export function CreateProductButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> New Product</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
        </DialogHeader>
        <ProductForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EditProductButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit product">
          <Pencil className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
        <SheetHeader className="pr-8">
          <div className="flex items-center justify-between">
            <SheetTitle>Edit Product</SheetTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="inline-flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Full-page editor
              </Link>
            </Button>
          </div>
        </SheetHeader>
        <div className="py-4">
          <ProductForm defaultValues={toFormValues(product)} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600"
          aria-label="Delete product"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the product as inactive. It will no longer appear in the store.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={isPending}
            className="bg-red-500 hover:bg-red-600"
            onClick={() => {
              const formData = new FormData();
              formData.set("productId", productId);
              startTransition(() => {
                deleteProductAction(formData)
                  .then(() => {
                    toast.success("Product deleted");
                    router.refresh();
                  })
                  .catch(() => toast.error("Failed to delete product"));
              });
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
