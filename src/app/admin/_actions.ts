"use server";

import { revalidatePath } from "next/cache";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { ConfigError } from "@/lib/api/errors";
import { notifyOrderStatusChanged } from "@/lib/notifications/events";
import { z } from "zod";
import type { ProductVariation } from "@/types";

const productOptionsInputSchema = z.array(
  z.object({
    name: z.string(),
    values: z.array(z.string()),
    position: z.number().nullable().optional()
  })
);

const productVariantsInputSchema = z.array(
  z.object({
    options: z.record(z.string(), z.string()),
    stock_qty: z.number(),
    price: z.number().nullable().optional()
  })
);

function normalizeOptionName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeOptionValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = normalizeOptionValue(raw);
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

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
  const optionsRaw = String(formData.get("options") || "[]");
  const variantsRaw = String(formData.get("variants") || "[]");

  let optionsInput: unknown = [];
  let variantsInput: unknown = [];
  try {
    optionsInput = JSON.parse(optionsRaw);
  } catch {
    optionsInput = [];
  }
  try {
    variantsInput = JSON.parse(variantsRaw);
  } catch {
    variantsInput = [];
  }

  const optionsParsed = productOptionsInputSchema.parse(optionsInput);
  const normalizedOptions = optionsParsed
    .map((o, idx) => ({
      name: normalizeOptionName(o.name),
      values: uniqueStrings(o.values ?? []),
      position: o.position ?? idx
    }))
    .filter((o) => o.name && o.values.length);

  const optionNames = new Set<string>();
  for (const opt of normalizedOptions) {
    const key = opt.name.toLowerCase();
    if (optionNames.has(key)) throw new ConfigError(`Duplicate option name: ${opt.name}`);
    optionNames.add(key);
  }

  const allowedValuesByName = new Map<string, Set<string>>();
  for (const opt of normalizedOptions) {
    allowedValuesByName.set(opt.name, new Set(opt.values));
  }

  const variantsParsed = productVariantsInputSchema.parse(variantsInput);
  const normalizedVariants = (variantsParsed.length ? variantsParsed : [{ options: {}, stock_qty: 0, price: null }]).map((v) => {
    const options: Record<string, string> = {};
    for (const [k, val] of Object.entries(v.options ?? {})) {
      const name = normalizeOptionName(k);
      const value = normalizeOptionValue(val);
      if (!name || !value) continue;
      options[name] = value;
    }
    const stock_qty = Number(v.stock_qty ?? 0);
    if (!Number.isFinite(stock_qty) || stock_qty < 0) throw new ConfigError("Invalid stock_qty");
    const price = v.price === null || v.price === undefined ? null : Number(v.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) throw new ConfigError("Invalid price");
    return { options, stock_qty, price };
  });

  if (normalizedOptions.length) {
    for (const variant of normalizedVariants) {
      for (const opt of normalizedOptions) {
        if (!(opt.name in variant.options)) throw new ConfigError(`Missing option value for: ${opt.name}`);
        const allowed = allowedValuesByName.get(opt.name);
        if (allowed && !allowed.has(variant.options[opt.name]!)) throw new ConfigError(`Invalid option value for: ${opt.name}`);
      }
    }
  } else {
    for (const variant of normalizedVariants) {
      if (Object.keys(variant.options).length) throw new ConfigError("Variants must not include options when product has no options");
    }
  }

  const created = await nocodb.createProduct({
    name,
    price,
    description,
    brand,
    is_active: true
  });

  await nocodb.replaceProductOptions(created.id, normalizedOptions);
  await nocodb.replaceProductVariants(created.id, normalizedVariants);

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
  const optionsRaw = String(formData.get("options") || "[]");
  const variantsRaw = String(formData.get("variants") || "[]");

  let optionsInput: unknown = [];
  let variantsInput: unknown = [];
  try {
    optionsInput = JSON.parse(optionsRaw);
  } catch {
    optionsInput = [];
  }
  try {
    variantsInput = JSON.parse(variantsRaw);
  } catch {
    variantsInput = [];
  }

  const optionsParsed = productOptionsInputSchema.parse(optionsInput);
  const normalizedOptions = optionsParsed
    .map((o, idx) => ({
      name: normalizeOptionName(o.name),
      values: uniqueStrings(o.values ?? []),
      position: o.position ?? idx
    }))
    .filter((o) => o.name && o.values.length);

  const optionNames = new Set<string>();
  for (const opt of normalizedOptions) {
    const key = opt.name.toLowerCase();
    if (optionNames.has(key)) throw new ConfigError(`Duplicate option name: ${opt.name}`);
    optionNames.add(key);
  }

  const allowedValuesByName = new Map<string, Set<string>>();
  for (const opt of normalizedOptions) {
    allowedValuesByName.set(opt.name, new Set(opt.values));
  }

  const variantsParsed = productVariantsInputSchema.parse(variantsInput);
  const normalizedVariants = (variantsParsed.length ? variantsParsed : [{ options: {}, stock_qty: 0, price: null }]).map((v) => {
    const options: Record<string, string> = {};
    for (const [k, val] of Object.entries(v.options ?? {})) {
      const name = normalizeOptionName(k);
      const value = normalizeOptionValue(val);
      if (!name || !value) continue;
      options[name] = value;
    }
    const stock_qty = Number(v.stock_qty ?? 0);
    if (!Number.isFinite(stock_qty) || stock_qty < 0) throw new ConfigError("Invalid stock_qty");
    const price = v.price === null || v.price === undefined ? null : Number(v.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) throw new ConfigError("Invalid price");
    return { options, stock_qty, price };
  });

  if (normalizedOptions.length) {
    for (const variant of normalizedVariants) {
      for (const opt of normalizedOptions) {
        if (!(opt.name in variant.options)) throw new ConfigError(`Missing option value for: ${opt.name}`);
        const allowed = allowedValuesByName.get(opt.name);
        if (allowed && !allowed.has(variant.options[opt.name]!)) throw new ConfigError(`Invalid option value for: ${opt.name}`);
      }
    }
  } else {
    for (const variant of normalizedVariants) {
      if (Object.keys(variant.options).length) throw new ConfigError("Variants must not include options when product has no options");
    }
  }

  await nocodb.updateProduct(id, {
    name,
    price,
    description,
    brand
  });

  await nocodb.replaceProductOptions(id, normalizedOptions);
  await nocodb.replaceProductVariants(id, normalizedVariants);

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

export async function listProductVariationsAction(productId: string) {
  if (!productId) return [];
  if (!isNocoConfigured()) return [];
  const nocodb = new NocoDBClient();
  return nocodb.listProductVariations(productId);
}

export async function getProductVariantConfigurationAction(productId: string) {
  if (!productId) return { options: [], variants: [], source: "none" as const };
  if (!isNocoConfigured()) return { options: [], variants: [], source: "none" as const };
  const nocodb = new NocoDBClient();
  return nocodb.getProductVariantConfiguration(productId);
}

export async function upsertProductVariationAction(args: {
  id?: string;
  productId: string;
  age_range: string;
  color: string;
  stock_qty: number;
}) {
  if (!isNocoConfigured()) {
    throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
  }
  const nocodb = new NocoDBClient();

  const productId = String(args.productId ?? "");
  if (!productId) throw new ConfigError("Missing productId");

  const ageRange = String(args.age_range ?? "").trim();
  const color = String(args.color ?? "").trim();
  const stockQty = Number(args.stock_qty ?? 0);
  if (!ageRange) throw new ConfigError("Missing age_range");
  if (!color) throw new ConfigError("Missing color");
  if (!Number.isFinite(stockQty) || stockQty < 0) throw new ConfigError("Invalid stock_qty");

  let result: ProductVariation;
  if (args.id) {
    result = await nocodb.updateProductVariation(String(args.id), { age_range: ageRange, color, stock_qty: stockQty });
  } else {
    result = await nocodb.createProductVariation({
      product_id: productId,
      age_range: ageRange,
      color,
      stock_qty: stockQty
    });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${productId}`);
  return result;
}

export async function deleteProductVariationAction(args: { id: string; productId: string }) {
  if (!isNocoConfigured()) return;
  const nocodb = new NocoDBClient();
  const id = String(args.id ?? "");
  const productId = String(args.productId ?? "");
  if (!id) return;
  await nocodb.deleteProductVariation(id);
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/products/${productId}`);
}
