"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatusAction } from "@/app/admin/_actions";
import { toast } from "sonner";
import { useState, useTransition } from "react";

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

  async function onValueChange(newStatus: string) {
    setStatus(newStatus);

    const nextLabel = statuses.find((s) => s.value === newStatus)?.label ?? newStatus;

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("order_status", newStatus);

    startTransition(() => {
      updateOrderStatusAction(formData)
        .then(() => {
          toast.success(`Order status updated to ${nextLabel}`);
        })
        .catch(() => {
          toast.error("Failed to update status");
          setStatus(normalizedCurrent);
        });
    });
  }

  return (
    <Select value={status} onValueChange={onValueChange} disabled={isPending}>
      <SelectTrigger className="w-[140px] h-9">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
