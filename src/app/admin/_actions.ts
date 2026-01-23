"use server";

import { revalidatePath } from "next/cache";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { ConfigError } from "@/lib/api/errors";
import { notifyOrderStatusChanged } from "@/lib/notifications/events";

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("order_status") ?? "");
  if (!orderId || !status) return;
  if (!isNocoConfigured()) return;
  const nocodb = new NocoDBClient();

  await nocodb.updateOrder(orderId, { order_status: status as any });

  try {
    const order = await nocodb.getOrder(orderId);
    await notifyOrderStatusChanged({
      orderId,
      phone: order.customer_phone,
      status
    });
  } catch (error) {
    console.error("Failed to notify order status change:", error);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function createProductAction(formData: FormData) {
  if (!isNocoConfigured()) {
    throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
  }
  const nocodb = new NocoDBClient();
  
  const name = String(formData.get("name"));
  const price = Number(formData.get("price"));
  const description = String(formData.get("description"));
  const brand = String(formData.get("brand"));
  const sizesRaw = String(formData.get("sizes") || "[]");
  const colorsRaw = String(formData.get("colors") || "[]");
  
  let sizes: string[] = [];
  let colors: string[] = [];
  try { sizes = JSON.parse(sizesRaw); } catch { sizes = sizesRaw.split(",").map(s => s.trim()).filter(Boolean); }
  try { colors = JSON.parse(colorsRaw); } catch { colors = colorsRaw.split(",").map(s => s.trim()).filter(Boolean); }

  await nocodb.createProduct({
    name,
    price,
    description,
    brand,
    sizes,
    colors,
    is_active: true
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function updateProductDetailsAction(formData: FormData) {
  if (!isNocoConfigured()) {
    throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
  }
  const nocodb = new NocoDBClient();
  
  const id = String(formData.get("id"));
  if (!id) return;

  const name = String(formData.get("name"));
  const price = Number(formData.get("price"));
  const description = String(formData.get("description"));
  const brand = String(formData.get("brand"));
  const sizesRaw = String(formData.get("sizes") || "[]");
  const colorsRaw = String(formData.get("colors") || "[]");
  
  let sizes: string[] = [];
  let colors: string[] = [];
  try { sizes = JSON.parse(sizesRaw); } catch { sizes = sizesRaw.split(",").map(s => s.trim()).filter(Boolean); }
  try { colors = JSON.parse(colorsRaw); } catch { colors = colorsRaw.split(",").map(s => s.trim()).filter(Boolean); }

  await nocodb.updateProduct(id, {
    name,
    price,
    description,
    brand,
    sizes,
    colors
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}

export async function deleteProductAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  if (!isNocoConfigured()) return;
  const nocodb = new NocoDBClient();
  await nocodb.deleteProduct(productId);
  revalidatePath("/admin/products");
  revalidatePath("/products");
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
