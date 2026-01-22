import { z } from "zod";
import type { InventoryItem, Order, OrderItem, Product, ProductImage, ProductSummary } from "@/types";

const listResponseSchema = z.object({
  list: z.array(z.unknown())
});

function asStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter((v) => v.trim().length > 0);
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String).filter((v) => v.trim().length > 0);
  } catch {}
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function asBoolean(value: unknown) {
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return value;
}

const productSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  original_price: z.number().nullable().optional(),
  brand: z.string().nullable().optional(),
  sizes: z.preprocess(asStringArray, z.array(z.string())).default([]),
  colors: z.preprocess(asStringArray, z.array(z.string())).default([]),
  is_active: z.preprocess(asBoolean, z.boolean()).optional(),
  stock_status: z.string().nullable().optional()
});

const productImageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  product_id: z.union([z.string(), z.number()]).transform(String),
  image_url: z.string(),
  display_order: z.number().nullable().optional(),
  is_primary: z.preprocess(asBoolean, z.boolean()).nullable().optional()
});

const inventoryItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  product_id: z.union([z.string(), z.number()]).transform(String),
  size: z.string(),
  color: z.string(),
  stock_qty: z.number(),
  low_stock_threshold: z.number().nullable().optional()
});

const orderSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_email: z.string(),
  customer_address: z.string(),
  customer_district: z.string(),
  special_instructions: z.string().nullable().optional(),
  total_amount: z.number(),
  payment_method: z.string(),
  payment_status: z.string(),
  payment_id: z.string().nullable().optional(),
  order_status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const orderItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  order_id: z.union([z.string(), z.number()]).transform(String),
  product_id: z.union([z.string(), z.number()]).transform(String),
  product_name: z.string(),
  product_price: z.number(),
  size: z.string(),
  color: z.string(),
  quantity: z.number(),
  subtotal: z.number()
});

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function isNocoConfigured() {
  return Boolean(process.env.NOCODB_API_URL && process.env.NOCODB_API_TOKEN && process.env.NOCODB_PROJECT_ID);
}

export class NocoDBClient {
  private baseUrl: string;
  private token: string;
  private projectId: string;

  constructor() {
    this.baseUrl = requiredEnv("NOCODB_API_URL").replace(/\/+$/, "");
    this.token = requiredEnv("NOCODB_API_TOKEN");
    this.projectId = requiredEnv("NOCODB_PROJECT_ID");
  }

  private url(pathname: string, query?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(`${this.baseUrl}${pathname}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private async requestJson<T>(pathname: string, init?: RequestInit, query?: Record<string, any>) {
    const res = await fetch(this.url(pathname, query), {
      ...init,
      headers: {
        "xc-auth": this.token,
        "xc-token": this.token,
        "content-type": "application/json",
        ...(init?.headers ?? {})
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`NocoDB request failed (${res.status}): ${text || res.statusText}`);
    }

    return (await res.json()) as T;
  }

  async listProducts(params: { page?: number; pageSize?: number; is_active?: boolean } = {}) {
    const limit = params.pageSize ?? 20;
    const page = params.page ?? 1;
    const offset = Math.max(0, (page - 1) * limit);

    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/products`, undefined, {
      limit,
      offset,
      where: params.is_active === undefined ? undefined : `(is_active,eq,${params.is_active ? 1 : 0})`
    });

    const parsed = listResponseSchema.parse(raw);
    const products = z.array(productSchema).parse(parsed.list);
    const items: ProductSummary[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      sizes: p.sizes,
      colors: p.colors
    }));

    return items;
  }

  async getProductById(id: string) {
    const raw = await this.requestJson<unknown>(
      `/api/v1/db/data/v1/${this.projectId}/products/${encodeURIComponent(id)}`
    );
    return productSchema.parse(raw) as Product;
  }

  async listProductImages(productId: string) {
    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/product_images`, undefined, {
      where: `(product_id,eq,${productId})`
    });
    const parsed = listResponseSchema.parse(raw);
    const images = z.array(productImageSchema).parse(parsed.list) as ProductImage[];
    return images.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  async listInventory(productId: string) {
    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/product_inventory`, undefined, {
      where: `(product_id,eq,${productId})`
    });
    const parsed = listResponseSchema.parse(raw);
    return z.array(inventoryItemSchema).parse(parsed.list) as InventoryItem[];
  }

  async createOrder(order: Partial<Order> & { id: string }) {
    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/orders`, {
      method: "POST",
      body: JSON.stringify(order)
    });
    return orderSchema.parse(raw) as Order;
  }

  async createOrderItem(item: Omit<OrderItem, "id">) {
    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/order_items`, {
      method: "POST",
      body: JSON.stringify(item)
    });
    return orderItemSchema.parse(raw) as OrderItem;
  }

  async getOrder(id: string) {
    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/orders/find-one`, undefined, {
      where: `(id,eq,${id})`
    });
    return orderSchema.parse(raw) as Order;
  }

  async updateOrder(id: string, patch: Partial<Order>) {
    const row = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/orders/find-one`, undefined, {
      where: `(id,eq,${id})`,
      fields: "row_id"
    });
    const rowId =
      typeof (row as any)?.row_id === "number" || typeof (row as any)?.row_id === "string" ? String((row as any).row_id) : null;
    if (!rowId) throw new Error("Order not found");

    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/orders/${encodeURIComponent(rowId)}`, {
      method: "PUT",
      body: JSON.stringify(patch)
    });
    return orderSchema.parse(raw) as Order;
  }

  async listOrderItems(orderId: string) {
    const raw = await this.requestJson<unknown>(`/api/v1/db/data/v1/${this.projectId}/order_items`, undefined, {
      where: `(order_id,eq,${orderId})`
    });
    const parsed = listResponseSchema.parse(raw);
    return z.array(orderItemSchema).parse(parsed.list) as OrderItem[];
  }
}
