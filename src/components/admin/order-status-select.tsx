"use client";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { updateOrderStatusAction } from "@/app/admin/_actions";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const normalizedCurrent = currentStatus?.toLowerCase() || "pending";
  const [status, setStatus] = useState(normalizedCurrent);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<string | null>(null);

  const labelFor = (value?: string | null) => statuses.find((s) => s.value === value)?.label ?? String(value ?? "");
  const currentLabel = labelFor(status) || "Status";
  const nextLabel = labelFor(nextStatus) || "Status";

  const statusBadge = (value?: string | null) => {
    const v = String(value ?? "").toLowerCase();
    if (v === "pending") return <Badge className="bg-red-50 text-red-700 border border-red-200">Pending</Badge>;
    if (v === "confirmed") return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Confirmed</Badge>;
    if (v === "shipped") return <Badge className="bg-purple-50 text-purple-700 border border-purple-200">Shipped</Badge>;
    if (v === "delivered") return <Badge className="bg-green-50 text-green-700 border border-green-200">Delivered</Badge>;
    if (v === "cancelled") return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">Cancelled</Badge>;
    return <Badge variant="outline" className="capitalize">{v || "—"}</Badge>;
  };

  function onValueChange(newStatus: string) {
    if (newStatus === status) return;
    setNextStatus(newStatus);
    setTimeout(() => setConfirmOpen(true), 0);
  }

  function applyChange() {
    const target = nextStatus;
    if (!target) return;
    setConfirmOpen(false);
    setStatus(target);

    const nextLabel = statuses.find((s) => s.value === target)?.label ?? target;

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("order_status", target);

    startTransition(() => {
      updateOrderStatusAction(formData)
        .then(() => {
          toast.success(`Order status updated to ${nextLabel}`);
        })
        .catch(() => {
          toast.error("Failed to update status");
          setStatus(normalizedCurrent);
        })
        .finally(() => setNextStatus(null));
    });
  }

  return (
    <>
      <Select value={status} onValueChange={onValueChange} disabled={isPending}>
        <SelectTrigger className="h-9 w-[200px] justify-between bg-muted/20 hover:bg-muted/40" aria-busy={isPending}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            {statusBadge(status)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Change</span>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update order status?</AlertDialogTitle>
            <AlertDialogDescription>
              Change from {currentLabel} to {nextLabel}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setNextStatus(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="button" onClick={applyChange} disabled={isPending}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
