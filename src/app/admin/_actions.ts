"use server";

import { revalidatePath } from "next/cache";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("order_status") ?? "");
  if (!orderId || !status) return;
  if (!isNocoConfigured()) return;
  const nocodb = new NocoDBClient();
  await nocodb.updateOrder(orderId, { order_status: status as any });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function setProductActiveAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const isActive = String(formData.get("is_active") ?? "");
  if (!productId) return;
  if (!isNocoConfigured()) return;
  const nocodb = new NocoDBClient();
  await nocodb.updateProduct(productId, { is_active: isActive === "true" });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}
