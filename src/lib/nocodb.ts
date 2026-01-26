import { z } from "zod";
import type { InventoryItem, Order, OrderItem, Product, ProductImage, ProductOption, ProductSummary, ProductVariant, ProductVariation } from "@/types";
import { ConfigError, NotFoundError, UpstreamError } from "@/lib/api/errors";

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

function asStringRecord(value: unknown) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(value as any)) {
      if (!k) continue;
      if (v === undefined || v === null) continue;
      const sv = String(v).trim();
      if (!sv) continue;
      out[String(k)] = sv;
    }
    return out;
  }
  if (typeof value !== "string") return {};
  const trimmed = value.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as any)) {
        if (!k) continue;
        if (v === undefined || v === null) continue;
        const sv = String(v).trim();
        if (!sv) continue;
        out[String(k)] = sv;
      }
      return out;
    }
  } catch {}
  return {};
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

const productVariationSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  product_id: z.union([z.string(), z.number()]).transform(String),
  age_range: z.string(),
  color: z.string(),
  stock_qty: z.number()
});

const productOptionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  product_id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  values: z.array(z.string()),
  position: z.number().nullable().optional()
});

const productVariantSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  product_id: z.union([z.string(), z.number()]).transform(String),
  options: z.record(z.string(), z.string()),
  stock_qty: z.number(),
  price: z.number().nullable().optional()
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

const orderItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String).optional(),
    row_id: z.union([z.string(), z.number()]).transform(String).optional(),
    order_id: z.union([z.string(), z.number()]).transform(String),
    product_id: z.union([z.string(), z.number()]).transform(String),
    product_name: z.string(),
    product_price: z.number(),
    size: z.string(),
    color: z.string(),
    quantity: z.number(),
    subtotal: z.number()
  })
  .refine((v) => Boolean(v.id ?? v.row_id), { path: ["id"], message: "Missing id" })
  .transform(({ id, row_id, ...rest }) => ({ id: id ?? (row_id as string), ...rest }));

const orderEventSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  order_id: z.string(),
  status: z.string(),
  note: z.string().nullable().optional(),
  created_at: z.string().optional()
});

type DataApiMode = "v1" | "org-table" | "org-table-id";
type SchemaProfile = "legacy" | "ecom";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new ConfigError(`${name} is required`);
  return value;
}

function parseDataApiMode(value: unknown): DataApiMode {
  if (value === "org-table" || value === "org-table-id" || value === "v1") return value;
  return "v1";
}

function parseSchemaProfile(value: unknown): SchemaProfile {
  if (value === "ecom" || value === "legacy") return value;
  return "legacy";
}

function unwrapRow(value: unknown): any {
  if (!value || typeof value !== "object") return value;
  const v: any = value;
  if (v.fields && typeof v.fields === "object") return v.fields;
  return v;
}

function normalizeKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function quoteWhereField(fieldTitle: string) {
  if (/^[a-zA-Z0-9_]+$/.test(fieldTitle)) return fieldTitle;
  return `'${fieldTitle.replace(/'/g, "\\'")}'`;
}

function quoteWhereValue(value: string | number | boolean) {
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${value.replace(/'/g, "\\'")}'`;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

type EcomOrderMeta = Partial<Pick<Order, "customer_phone" | "customer_email" | "customer_address" | "customer_district">> &
  Partial<Pick<Order, "special_instructions" | "payment_method" | "payment_status" | "payment_id" | "order_status">> & {
    order_ref?: string;
  };

function encodeEcomOrderCustomerName(displayName: string, meta: EcomOrderMeta) {
  const safeName = displayName?.trim() || "Customer";
  const compactMeta: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    compactMeta[k] = v;
  }
  if (!Object.keys(compactMeta).length) return safeName;
  return `${safeName} ||meta:${base64UrlEncode(JSON.stringify(compactMeta))}`;
}

function decodeEcomOrderCustomerName(raw: unknown): { displayName: string; meta: EcomOrderMeta } {
  if (typeof raw !== "string" || !raw.trim()) return { displayName: "", meta: {} };
  const marker = "||meta:";
  const idx = raw.indexOf(marker);
  if (idx === -1) return { displayName: raw.trim(), meta: {} };
  const displayName = raw.slice(0, idx).trim();
  const encoded = raw.slice(idx + marker.length).trim();
  if (!encoded) return { displayName, meta: {} };
  try {
    const parsed = JSON.parse(base64UrlDecode(encoded));
    return { displayName, meta: parsed && typeof parsed === "object" ? (parsed as any) : {} };
  } catch {
    return { displayName, meta: {} };
  }
}

export function isNocoConfigured() {
  return Boolean(process.env.NOCODB_API_URL && process.env.NOCODB_API_TOKEN && process.env.NOCODB_PROJECT_ID);
}

export class NocoDBClient {
  private baseUrl: string;
  private token: string;
  private projectId: string;
  private dataApiMode: DataApiMode;
  private org: string;
  private tableIdByTitle: Map<string, string> | null = null;
  private schemaProfile: SchemaProfile;

  constructor() {
    this.baseUrl = requiredEnv("NOCODB_API_URL").replace(/\/+$/, "");
    this.token = requiredEnv("NOCODB_API_TOKEN");
    this.projectId = requiredEnv("NOCODB_PROJECT_ID");
    this.dataApiMode = parseDataApiMode(process.env.NOCODB_DATA_API_MODE);
    this.org = (process.env.NOCODB_ORG || "noco").trim() || "noco";
    this.schemaProfile = parseSchemaProfile(process.env.NOCODB_SCHEMA_PROFILE);
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
    try {
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
        if (res.status === 404) throw new NotFoundError("Not found");
        throw new UpstreamError({ service: "nocodb", status: res.status });
      }

      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof UpstreamError) throw error;
      throw new UpstreamError({
        service: "nocodb",
        status: 503,
        message: "NocoDB is not reachable. Ensure the server is running.",
        details: error
      });
    }
  }

  private async ensureTableIdMap() {
    if (this.tableIdByTitle) return;
    const raw = await this.requestJson<unknown>(`/api/v1/db/meta/projects/${this.projectId}/tables`);
    const list = Array.isArray((raw as any)?.list) ? (raw as any).list : [];
    const map = new Map<string, string>();
    for (const table of list) {
      const id = typeof table?.id === "string" ? table.id : null;
      if (!id) continue;
      const title = typeof table?.title === "string" ? table.title : null;
      const tableName = typeof table?.table_name === "string" ? table.table_name : null;
      for (const key of [title, tableName].filter(Boolean) as string[]) {
        map.set(key, id);
        map.set(key.toLowerCase(), id);
        map.set(normalizeKey(key), id);
      }
    }
    this.tableIdByTitle = map;
  }

  private async ensureEcomOptionAndVariantTables() {
    if (this.schemaProfile !== "ecom") return;

    const raw = await this.requestJson<unknown>(`/api/v1/db/meta/projects/${this.projectId}/tables`);
    const tables = Array.isArray((raw as any)?.list) ? (raw as any).list : [];
    const sourceId = tables[0]?.source_id;
    if (!sourceId) return;

    const findTable = (table_name: string, title: string) =>
      tables.find((t: any) => t?.table_name === table_name) ?? tables.find((t: any) => t?.title === title) ?? null;

    const ensureTable = async (args: { table_name: string; title: string; columns: any[] }) => {
      const existing = findTable(args.table_name, args.title);
      if (existing?.id) return String(existing.id);
      const created = await this.requestJson<unknown>(`/api/v2/meta/bases/${this.projectId}/tables`, {
        method: "POST",
        body: JSON.stringify({
          title: args.title,
          table_name: args.table_name,
          type: "table",
          source_id: sourceId,
          columns: args.columns
        })
      });
      const id = (created as any)?.id;
      return id ? String(id) : "";
    };

    const ensureColumn = async (tableId: string, column: any) => {
      if (!tableId) return;
      const tableMeta = await this.requestJson<unknown>(`/api/v1/db/meta/tables/${encodeURIComponent(tableId)}`);
      const cols = Array.isArray((tableMeta as any)?.columns) ? (tableMeta as any).columns : [];
      const exists =
        cols.some((c: any) => String(c?.title ?? "").toLowerCase() === String(column.title ?? "").toLowerCase()) ||
        cols.some((c: any) => String(c?.column_name ?? "").toLowerCase() === String(column.column_name ?? "").toLowerCase());
      if (exists) return;
      await this.requestJson<unknown>(`/api/v1/db/meta/tables/${encodeURIComponent(tableId)}/columns`, {
        method: "POST",
        body: JSON.stringify(column)
      });
    };

    const productOptionsTableId = await ensureTable({
      title: "Product Options",
      table_name: "product_options",
      columns: [
        { title: "Id", column_name: "Id", uidt: "ID" },
        { title: "Products_id", column_name: "Products_id", uidt: "Number" },
        { title: "Name", column_name: "name", uidt: "SingleLineText" },
        { title: "Values", column_name: "values_json", uidt: "LongText" },
        { title: "Position", column_name: "position", uidt: "Number" }
      ]
    });

    const productVariantsTableId = await ensureTable({
      title: "Product Variants",
      table_name: "product_variants",
      columns: [
        { title: "Id", column_name: "Id", uidt: "ID" },
        { title: "Products_id", column_name: "Products_id", uidt: "Number" },
        { title: "Options", column_name: "options_json", uidt: "LongText" },
        { title: "Stock Qty", column_name: "stock_qty", uidt: "Number" },
        { title: "Price", column_name: "price", uidt: "Number" }
      ]
    });

    const productImagesTableId = await ensureTable({
      title: "Product Images",
      table_name: "product_images",
      columns: [
        { title: "Id", column_name: "Id", uidt: "ID" },
        { title: "Products_id", column_name: "Products_id", uidt: "Number" },
        { title: "Image URL", column_name: "image_url", uidt: "SingleLineText" },
        { title: "Display Order", column_name: "display_order", uidt: "Number" },
        { title: "Is Thumbnail", column_name: "is_primary", uidt: "Checkbox" }
      ]
    });

    await ensureColumn(productVariantsTableId, { title: "Price", column_name: "price", uidt: "Number" });
    if (productOptionsTableId || productVariantsTableId || productImagesTableId) this.tableIdByTitle = null;
  }

  private async ensureOrderEventsTable() {
    const raw = await this.requestJson<unknown>(`/api/v1/db/meta/projects/${this.projectId}/tables`);
    const tables = Array.isArray((raw as any)?.list) ? (raw as any).list : [];
    const sourceId = tables[0]?.source_id;
    if (!sourceId) return;

    const existing =
      tables.find((t: any) => t?.table_name === "order_events") ?? tables.find((t: any) => t?.title === "Order Events") ?? null;
    if (existing?.id) return;

    await this.requestJson<unknown>(`/api/v2/meta/bases/${this.projectId}/tables`, {
      method: "POST",
      body: JSON.stringify({
        title: "Order Events",
        table_name: "order_events",
        type: "table",
        source_id: sourceId,
        columns: [
          { title: "Id", column_name: "Id", uidt: "ID" },
          { title: "Order ID", column_name: "order_id", uidt: "SingleLineText" },
          { title: "Status", column_name: "status", uidt: "SingleLineText" },
          { title: "Note", column_name: "note", uidt: "LongText" }
        ]
      })
    });

    this.tableIdByTitle = null;
  }

  private async resolveTableSegment(tableTitle: string) {
    if (this.dataApiMode !== "org-table-id") return encodeURIComponent(tableTitle);
    await this.ensureTableIdMap();
    const id =
      this.tableIdByTitle?.get(tableTitle) ??
      this.tableIdByTitle?.get(tableTitle.toLowerCase()) ??
      this.tableIdByTitle?.get(normalizeKey(tableTitle)) ??
      null;
    if (!id) throw new ConfigError(`NocoDB table not found: ${tableTitle}`);
    return encodeURIComponent(id);
  }

  private async dataTablePath(tableTitle: string) {
    if (this.dataApiMode === "org-table" || this.dataApiMode === "org-table-id") {
      const seg = await this.resolveTableSegment(tableTitle);
      return `/api/v1/db/data/${encodeURIComponent(this.org)}/${encodeURIComponent(this.projectId)}/${seg}`;
    }
    return `/api/v1/db/data/v1/${encodeURIComponent(this.projectId)}/${encodeURIComponent(tableTitle)}`;
  }

  private async dataRequestJson<T>(
    tableTitle: string,
    suffixPath: string,
    init?: RequestInit,
    query?: Record<string, any>
  ) {
    const pathname = `${await this.dataTablePath(tableTitle)}${suffixPath}`;
    return this.requestJson<T>(pathname, init, query);
  }

  private async findOne(tableTitle: string, where: string, fields?: string) {
    if (this.dataApiMode === "v1") {
      return this.dataRequestJson<unknown>(tableTitle, "/find-one", undefined, { where, ...(fields ? { fields } : {}) });
    }
    const raw = await this.dataRequestJson<unknown>(tableTitle, "", undefined, {
      where,
      limit: 1,
      offset: 0,
      ...(fields ? { fields } : {})
    });
    const parsed = listResponseSchema.parse(raw);
    return parsed.list[0] ?? null;
  }

  private whereEq(fieldTitle: string, value: string | number | boolean) {
    return `(${quoteWhereField(fieldTitle)},eq,${quoteWhereValue(value)})`;
  }

  private whereIn(fieldTitle: string, values: Array<string | number | boolean>) {
    const parts = values.map((v) => quoteWhereValue(v)).join(",");
    return `(${quoteWhereField(fieldTitle)},in,${parts})`;
  }

  private parseProduct(row: unknown) {
    if (this.schemaProfile === "legacy") return productSchema.parse(row) as Product;
    const r = unwrapRow(row);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      name: (r as any)?.["Product Name"] ?? (r as any)?.["Name"],
      description: (r as any)?.["Description"] ?? null,
      price: Number((r as any)?.["Price"]),
      original_price: null,
      brand: null,
      sizes: [],
      colors: [],
      is_active: (r as any)?.["Is Active"] ?? false,
      stock_status: null
    };
    return productSchema.parse(mapped) as Product;
  }

  private parseProductImage(row: unknown) {
    if (this.schemaProfile === "legacy") return productImageSchema.parse(row) as ProductImage;
    const r = unwrapRow(row);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      product_id: (r as any)?.Products_id ?? (r as any)?.product_id,
      image_url: (r as any)?.["Image URL"] ?? (r as any)?.["Image Url"] ?? (r as any)?.image_url,
      display_order: (r as any)?.["Display Order"] ?? null,
      is_primary: (r as any)?.["Is Thumbnail"] ?? false
    };
    return productImageSchema.parse(mapped) as ProductImage;
  }

  private parseInventoryItem(row: unknown) {
    if (this.schemaProfile === "legacy") return inventoryItemSchema.parse(row) as InventoryItem;
    const r = unwrapRow(row);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      product_id: (r as any)?.Products_id ?? (r as any)?.product_id,
      size: "One Size",
      color: "Default",
      stock_qty: Number((r as any)?.["Quantity Available"] ?? (r as any)?.stock_qty ?? 0),
      low_stock_threshold: (r as any)?.["Reorder Level"] ?? null
    };
    return inventoryItemSchema.parse(mapped) as InventoryItem;
  }

  private parseProductVariation(row: unknown) {
    if (this.schemaProfile === "legacy") throw new Error("Product variations not supported in legacy schema");
    const r = unwrapRow(row);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      product_id: (r as any)?.Products_id ?? (r as any)?.product_id,
      age_range: String((r as any)?.["Age Range"] ?? (r as any)?.age_range ?? ""),
      color: String((r as any)?.["Color"] ?? (r as any)?.color ?? ""),
      stock_qty: Number((r as any)?.["Stock Qty"] ?? (r as any)?.stock_qty ?? 0)
    };
    return productVariationSchema.parse(mapped) as ProductVariation;
  }

  private parseProductOption(row: unknown) {
    const r = unwrapRow(row);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      product_id: (r as any)?.Products_id ?? (r as any)?.product_id,
      name: String((r as any)?.["Name"] ?? (r as any)?.name ?? ""),
      values: asStringArray((r as any)?.["Values"] ?? (r as any)?.values_json ?? (r as any)?.values ?? []),
      position: (r as any)?.["Position"] ?? (r as any)?.position ?? null
    };
    return productOptionSchema.parse(mapped) as ProductOption;
  }

  private parseProductVariant(row: unknown) {
    const r = unwrapRow(row);
    const rawPrice = (r as any)?.["Price"] ?? (r as any)?.price ?? null;
    const parsedPrice =
      rawPrice === null || rawPrice === undefined || rawPrice === "" ? null : Number(rawPrice);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      product_id: (r as any)?.Products_id ?? (r as any)?.product_id,
      options: asStringRecord((r as any)?.["Options"] ?? (r as any)?.options_json ?? (r as any)?.options ?? {}),
      stock_qty: Number((r as any)?.["Stock Qty"] ?? (r as any)?.stock_qty ?? 0),
      price: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null
    };
    return productVariantSchema.parse(mapped) as ProductVariant;
  }

  private parseOrder(row: unknown) {
    if (this.schemaProfile === "legacy") return orderSchema.parse(row) as Order;
    const r = unwrapRow(row);
    const decoded = decodeEcomOrderCustomerName((r as any)?.["Customer Name"]);
    const meta = decoded.meta ?? {};
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      customer_name: decoded.displayName ?? "",
      customer_phone: meta.customer_phone ?? "",
      customer_email: meta.customer_email ?? "",
      customer_address: meta.customer_address ?? "",
      customer_district: meta.customer_district ?? "",
      special_instructions: meta.special_instructions ?? null,
      total_amount: Number((r as any)?.["Total Amount"] ?? 0),
      payment_method: meta.payment_method ?? String((r as any)?.["Payment Method"] ?? (r as any)?.payment_method ?? ""),
      payment_status: meta.payment_status ?? String((r as any)?.["Payment Status"] ?? (r as any)?.payment_status ?? ""),
      payment_id: meta.payment_id ?? ((r as any)?.["Payment ID"] ?? (r as any)?.payment_id ?? null),
      order_status: String(meta.order_status ?? (r as any)?.["Status"] ?? "pending").toLowerCase(),
      created_at:
        (r as any)?.CreatedAt ??
        (r as any)?.["Created At"] ??
        (r as any)?.["Created at"] ??
        (r as any)?.createdAt ??
        (r as any)?.created_at,
      updated_at:
        (r as any)?.UpdatedAt ??
        (r as any)?.["Updated At"] ??
        (r as any)?.["Updated at"] ??
        (r as any)?.updatedAt ??
        (r as any)?.updated_at
    };
    return orderSchema.parse(mapped) as Order;
  }

  private parseOrderItem(row: unknown) {
    if (this.schemaProfile === "legacy") return orderItemSchema.parse(row) as OrderItem;
    const r = unwrapRow(row);
    const price = Number((r as any)?.["Price"] ?? 0);
    const quantity = Number((r as any)?.["Quantity"] ?? 0);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      row_id: (r as any)?.["Row Id"] ?? (r as any)?.row_id,
      order_id: (r as any)?.["Order ID"] ?? (r as any)?.order_id ?? "",
      product_id: (r as any)?.["Product SKU"] ?? (r as any)?.product_id ?? "",
      product_name: (r as any)?.["Product Name"] ?? (r as any)?.product_name ?? "",
      product_price: price,
      size: "One Size",
      color: "Default",
      quantity,
      subtotal: Number.isFinite(price * quantity) ? price * quantity : 0
    };
    return orderItemSchema.parse(mapped) as OrderItem;
  }

  private parseOrderEvent(row: unknown) {
    const r = unwrapRow(row);
    const mapped = {
      id: (r as any)?.Id ?? (r as any)?.id ?? (row as any)?.id,
      order_id: String((r as any)?.["Order ID"] ?? (r as any)?.order_id ?? ""),
      status: String((r as any)?.["Status"] ?? (r as any)?.status ?? ""),
      note: ((r as any)?.["Note"] ?? (r as any)?.note ?? null) as any,
      created_at: (r as any)?.CreatedAt ?? (r as any)?.created_at
    };
    return orderEventSchema.parse(mapped);
  }

  async listProducts(params: { page?: number; pageSize?: number; is_active?: boolean } = {}) {
    const limit = params.pageSize ?? 20;
    const page = params.page ?? 1;
    const offset = Math.max(0, (page - 1) * limit);

    const where =
      params.is_active === undefined
        ? undefined
        : this.schemaProfile === "ecom"
          ? this.whereEq("Is Active", params.is_active)
          : `(is_active,eq,${params.is_active ? 1 : 0})`;

    const raw = await this.dataRequestJson<unknown>("products", "", undefined, {
      limit,
      offset,
      where
    });

    const parsed = listResponseSchema.parse(raw);
    const products = parsed.list.map((row) => this.parseProduct(row));
    const items: ProductSummary[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      sizes: p.sizes,
      colors: p.colors
    }));

    return items;
  }

  async listProductsAdmin(params: { page?: number; pageSize?: number } = {}) {
    const limit = params.pageSize ?? 50;
    const page = params.page ?? 1;
    const offset = Math.max(0, (page - 1) * limit);

    const raw = await this.dataRequestJson<unknown>("products", "", undefined, { limit, offset });

    const parsed = listResponseSchema.parse(raw);
    return parsed.list.map((row) => this.parseProduct(row));
  }

  async getProductById(id: string) {
    if (this.schemaProfile === "ecom") {
      const raw = await this.dataRequestJson<unknown>("products", `/${encodeURIComponent(id)}`);
      return this.parseProduct(raw);
    }
    if (this.dataApiMode === "v1") {
      const raw = await this.dataRequestJson<unknown>("products", `/${encodeURIComponent(id)}`);
      return this.parseProduct(raw);
    }
    const row = await this.findOne("products", `(id,eq,${id})`);
    if (!row) throw new NotFoundError("Not found");
    return this.parseProduct(row);
  }

  async updateProduct(id: string, patch: Partial<Product>) {
    if (this.schemaProfile === "ecom") {
      const mappedPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) mappedPatch["Product Name"] = patch.name;
      if (patch.description !== undefined) mappedPatch["Description"] = patch.description;
      if (patch.price !== undefined) mappedPatch["Price"] = patch.price;
      if (patch.is_active !== undefined) mappedPatch["Is Active"] = patch.is_active;

      const raw = await this.dataRequestJson<unknown>("products", `/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(mappedPatch)
      });
      return this.parseProduct(raw);
    }

    const row = await this.findOne("products", `(id,eq,${id})`, "row_id");
    const rowId = typeof (row as any)?.row_id === "number" || typeof (row as any)?.row_id === "string" ? String((row as any).row_id) : null;
    if (!rowId) throw new NotFoundError("Product not found");

    const raw = await this.dataRequestJson<unknown>("products", `/${encodeURIComponent(rowId)}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
    return this.parseProduct(raw);
  }

  async createProduct(product: Partial<Product>) {
    if (this.schemaProfile === "ecom") {
      const mapped: Record<string, unknown> = {};
      if (product.name !== undefined) mapped["Product Name"] = product.name;
      if (product.description !== undefined) mapped["Description"] = product.description;
      if (product.price !== undefined) mapped["Price"] = product.price;
      if (product.is_active !== undefined) mapped["Is Active"] = product.is_active;

      const raw = await this.dataRequestJson<unknown>("products", "", {
        method: "POST",
        body: JSON.stringify(mapped)
      });
      return this.parseProduct(raw);
    }

    const raw = await this.dataRequestJson<unknown>("products", "", {
      method: "POST",
      body: JSON.stringify(product)
    });
    return this.parseProduct(raw);
  }

  async deleteProduct(id: string) {
    return this.updateProduct(id, { is_active: false });
  }

  async updateInventory(id: string, patch: Partial<InventoryItem>) {
    try {
      const body =
        this.schemaProfile === "ecom"
          ? JSON.stringify({
              ...(patch.stock_qty !== undefined ? { "Quantity Available": patch.stock_qty } : {}),
              ...(patch.low_stock_threshold !== undefined ? { "Reorder Level": patch.low_stock_threshold } : {})
            })
          : JSON.stringify(patch);
      const raw = await this.dataRequestJson<unknown>(
        "product_inventory",
        `/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body
        }
      );
      return this.parseInventoryItem(raw);
    } catch (error) {
      const row = await this.findOne("product_inventory", `(id,eq,${id})`, "row_id");
      const rowId =
        typeof (row as any)?.row_id === "number" || typeof (row as any)?.row_id === "string" ? String((row as any).row_id) : null;
      if (!rowId) throw error;

      const body =
        this.schemaProfile === "ecom"
          ? JSON.stringify({
              ...(patch.stock_qty !== undefined ? { "Quantity Available": patch.stock_qty } : {}),
              ...(patch.low_stock_threshold !== undefined ? { "Reorder Level": patch.low_stock_threshold } : {})
            })
          : JSON.stringify(patch);
      const raw = await this.dataRequestJson<unknown>(
        "product_inventory",
        `/${encodeURIComponent(rowId)}`,
        {
          method: "PATCH",
          body
        }
      );
      return this.parseInventoryItem(raw);
    }
  }

  async listProductImages(productId: string) {
    const where = this.schemaProfile === "ecom" ? this.whereEq("Products_id", Number(productId)) : `(product_id,eq,${productId})`;
    const raw = await this.dataRequestJson<unknown>("product_images", "", undefined, {
      where
    });
    const parsed = listResponseSchema.parse(raw);
    const images = parsed.list.map((row) => this.parseProductImage(row));
    return images.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  async createProductImages(
    productId: string,
    images: Array<{ image_url: string; display_order?: number | null; is_primary?: boolean | null }>
  ): Promise<ProductImage[]> {
    const normalized = images
      .map((img, idx) => ({
        image_url: String(img.image_url ?? "").trim(),
        display_order: img.display_order ?? idx,
        is_primary: Boolean(img.is_primary)
      }))
      .filter((img) => Boolean(img.image_url));

    if (!normalized.length) return [];

    try {
      const created: ProductImage[] = [];
      for (const img of normalized) {
        const body =
          this.schemaProfile === "ecom"
            ? {
                Products_id: Number(productId),
                "Image URL": img.image_url,
                "Is Thumbnail": img.is_primary
              }
            : {
                product_id: productId,
                image_url: img.image_url,
                display_order: img.display_order ?? 0,
                is_primary: img.is_primary
              };

        const raw = await this.dataRequestJson<unknown>("product_images", "", {
          method: "POST",
          body: JSON.stringify(body)
        });
        created.push(this.parseProductImage(raw));
      }
      return created.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    } catch (error) {
      if (error instanceof ConfigError && String(error.message ?? "").includes("product_images")) {
        await this.ensureEcomOptionAndVariantTables();
        return this.createProductImages(productId, images);
      }
      throw error;
    }
  }

  async replaceProductImages(
    productId: string,
    images: Array<{ image_url: string; display_order?: number | null; is_primary?: boolean | null; alt_text?: string | null }>
  ): Promise<ProductImage[]> {
    const existing = await this.listProductImages(productId);
    for (const img of existing) {
      await this.dataRequestJson<unknown>("product_images", `/${encodeURIComponent(img.id)}`, { method: "DELETE" }).catch(() => {});
    }

    const normalized = images
      .map((img, idx) => ({
        image_url: String(img.image_url ?? "").trim(),
        display_order: img.display_order ?? idx,
        is_primary: Boolean(img.is_primary),
        alt_text: img.alt_text ? String(img.alt_text).trim() : null
      }))
      .filter((img) => Boolean(img.image_url));

    if (!normalized.length) return [];

    if (this.schemaProfile === "ecom") {
      const created: ProductImage[] = [];
      for (const img of normalized) {
        const body: Record<string, unknown> = {
          Products_id: Number(productId),
          "Image URL": img.image_url,
          "Is Thumbnail": img.is_primary
        };
        if (img.alt_text) body["Alt Text"] = img.alt_text;
        const raw = await this.dataRequestJson<unknown>("product_images", "", {
          method: "POST",
          body: JSON.stringify(body)
        });
        created.push(this.parseProductImage(raw));
      }
      return created;
    }

    return this.createProductImages(productId, normalized);
  }

  async listFeaturedImages(productIds: string[]): Promise<Map<string, string>> {
    const ids = Array.from(new Set(productIds.map((id) => String(id)).filter(Boolean)));
    if (!ids.length) return new Map<string, string>();

    try {
      const where =
        this.schemaProfile === "ecom"
          ? this.whereIn(
              "Products_id",
              ids.map((id) => Number(id)).filter((n) => Number.isFinite(n))
            )
          : this.whereIn("product_id", ids);

      const raw = await this.dataRequestJson<unknown>("product_images", "", undefined, {
        where,
        limit: 1000,
        offset: 0
      });
      const parsed = listResponseSchema.parse(raw);
      const rows = parsed.list.map((row) => this.parseProductImage(row));

      const byProduct = new Map<string, ProductImage[]>();
      for (const img of rows) {
        const list = byProduct.get(img.product_id) ?? [];
        list.push(img);
        byProduct.set(img.product_id, list);
      }

      const out = new Map<string, string>();
      for (const id of ids) {
        const list = (byProduct.get(id) ?? []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        const featured = list.find((i) => Boolean(i.is_primary)) ?? list[0] ?? null;
        if (featured?.image_url) out.set(id, featured.image_url);
      }
      return out;
    } catch (error) {
      if (error instanceof ConfigError && String(error.message ?? "").includes("product_images")) {
        await this.ensureEcomOptionAndVariantTables();
        return this.listFeaturedImages(productIds);
      }
      throw error;
    }
  }

  async listInventory(productId: string) {
    if (this.schemaProfile === "ecom") {
      const variants = await this.listProductVariants(productId);
      if (variants.length) {
        return variants.map((v) => {
          const keys = Object.keys(v.options ?? {}).sort((a, b) => a.localeCompare(b));
          const size = keys[0] ? v.options[keys[0]!] : "Default";
          const color = keys[1] ? v.options[keys[1]!] : "Default";
          return inventoryItemSchema.parse({
            id: v.id,
            product_id: v.product_id,
            size: size ?? "Default",
            color: color ?? "Default",
            stock_qty: v.stock_qty,
            low_stock_threshold: null
          });
        });
      }

      const legacy = await this.listProductVariations(productId);
      if (legacy.length) {
        return legacy.map((v) =>
          inventoryItemSchema.parse({
            id: v.id,
            product_id: v.product_id,
            size: v.age_range,
            color: v.color,
            stock_qty: v.stock_qty,
            low_stock_threshold: null
          })
        );
      }
    }

    const where = this.schemaProfile === "ecom" ? this.whereEq("Products_id", Number(productId)) : `(product_id,eq,${productId})`;
    const raw = await this.dataRequestJson<unknown>("product_inventory", "", undefined, {
      where
    });
    const parsed = listResponseSchema.parse(raw);
    return parsed.list.map((row) => this.parseInventoryItem(row));
  }

  async listProductVariations(productId: string) {
    if (this.schemaProfile !== "ecom") return [];
    try {
      const raw = await this.dataRequestJson<unknown>("product_variations", "", undefined, {
        where: this.whereEq("Products_id", Number(productId)),
        limit: 200,
        offset: 0
      });
      const parsed = listResponseSchema.parse(raw);
      return parsed.list.map((row) => this.parseProductVariation(row));
    } catch (error) {
      if (error instanceof ConfigError || error instanceof NotFoundError) return [];
      throw error;
    }
  }

  async createProductVariation(input: Omit<ProductVariation, "id">) {
    if (this.schemaProfile !== "ecom") throw new ConfigError("Product variations are only supported in ecom schema profile");
    const body = {
      Products_id: Number(input.product_id),
      "Age Range": input.age_range,
      Color: input.color,
      "Stock Qty": input.stock_qty
    };
    const raw = await this.dataRequestJson<unknown>("product_variations", "", {
      method: "POST",
      body: JSON.stringify(body)
    });
    return this.parseProductVariation(raw);
  }

  async updateProductVariation(id: string, patch: Partial<Pick<ProductVariation, "age_range" | "color" | "stock_qty">>) {
    if (this.schemaProfile !== "ecom") throw new ConfigError("Product variations are only supported in ecom schema profile");
    const body: Record<string, unknown> = {};
    if (patch.age_range !== undefined) body["Age Range"] = patch.age_range;
    if (patch.color !== undefined) body["Color"] = patch.color;
    if (patch.stock_qty !== undefined) body["Stock Qty"] = patch.stock_qty;
    const raw = await this.dataRequestJson<unknown>("product_variations", `/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
    return this.parseProductVariation(raw);
  }

  async deleteProductVariation(id: string) {
    if (this.schemaProfile !== "ecom") throw new ConfigError("Product variations are only supported in ecom schema profile");
    await this.dataRequestJson<unknown>("product_variations", `/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  async listProductOptions(productId: string) {
    try {
      const raw = await this.dataRequestJson<unknown>("product_options", "", undefined, {
        where: this.whereEq("Products_id", Number(productId)),
        limit: 200,
        offset: 0
      });
      const parsed = listResponseSchema.parse(raw);
      return parsed.list.map((row) => this.parseProductOption(row)).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    } catch (error) {
      if (error instanceof ConfigError || error instanceof NotFoundError) return [];
      throw error;
    }
  }

  async replaceProductOptions(
    productId: string,
    options: Array<{ name: string; values: string[]; position?: number | null }>
  ) {
    try {
      const existing = await this.listProductOptions(productId);
      for (const row of existing) {
        await this.dataRequestJson<unknown>("product_options", `/${encodeURIComponent(row.id)}`, { method: "DELETE" });
      }

      const created: ProductOption[] = [];
      for (const option of options) {
        const body = {
          Products_id: Number(productId),
          Name: option.name,
          Values: JSON.stringify(option.values ?? []),
          ...(option.position !== undefined ? { Position: option.position } : {})
        };
        const raw = await this.dataRequestJson<unknown>("product_options", "", {
          method: "POST",
          body: JSON.stringify(body)
        });
        created.push(this.parseProductOption(raw));
      }
      return created.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    } catch (error) {
      if (error instanceof ConfigError && String(error.message ?? "").includes("product_options")) {
        await this.ensureEcomOptionAndVariantTables();
        const retry = await this.listProductOptions(productId);
        for (const row of retry) {
          await this.dataRequestJson<unknown>("product_options", `/${encodeURIComponent(row.id)}`, { method: "DELETE" });
        }
        const created: ProductOption[] = [];
        for (const option of options) {
          const body = {
            Products_id: Number(productId),
            Name: option.name,
            Values: JSON.stringify(option.values ?? []),
            ...(option.position !== undefined ? { Position: option.position } : {})
          };
          const raw = await this.dataRequestJson<unknown>("product_options", "", {
            method: "POST",
            body: JSON.stringify(body)
          });
          created.push(this.parseProductOption(raw));
        }
        return created.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      throw error;
    }
  }

  async listProductVariants(productId: string) {
    try {
      const raw = await this.dataRequestJson<unknown>("product_variants", "", undefined, {
        where: this.whereEq("Products_id", Number(productId)),
        limit: 500,
        offset: 0
      });
      const parsed = listResponseSchema.parse(raw);
      return parsed.list.map((row) => this.parseProductVariant(row));
    } catch (error) {
      if (error instanceof ConfigError || error instanceof NotFoundError) return [];
      throw error;
    }
  }

  async getProductVariantConfiguration(productId: string) {
    const options = await this.listProductOptions(productId);
    const variants = await this.listProductVariants(productId);
    if (options.length || variants.length) {
      return { options, variants, source: "product_variants" as const };
    }

    if (this.schemaProfile === "ecom") {
      const legacy = await this.listProductVariations(productId);
      if (legacy.length) {
        const ageRanges = Array.from(new Set(legacy.map((v) => v.age_range).filter(Boolean)));
        const colors = Array.from(new Set(legacy.map((v) => v.color).filter(Boolean)));
        return {
          options: [
            { id: "legacy-age-range", product_id: productId, name: "Age Range", values: ageRanges, position: 0 },
            { id: "legacy-color", product_id: productId, name: "Color", values: colors, position: 1 }
          ],
          variants: legacy.map((v) => ({
            id: v.id,
            product_id: v.product_id,
            options: { "Age Range": v.age_range, Color: v.color },
            stock_qty: v.stock_qty,
            price: null
          })),
          source: "product_variations" as const
        };
      }
    }

    return { options: [], variants: [], source: "none" as const };
  }

  async replaceProductVariants(
    productId: string,
    variants: Array<{ options: Record<string, string>; stock_qty: number; price?: number | null }>
  ) {
    try {
      const existing = await this.listProductVariants(productId);
      for (const row of existing) {
        await this.dataRequestJson<unknown>("product_variants", `/${encodeURIComponent(row.id)}`, { method: "DELETE" });
      }

      const created: ProductVariant[] = [];
      for (const variant of variants) {
        const body = {
          Products_id: Number(productId),
          Options: JSON.stringify(variant.options ?? {}),
          "Stock Qty": variant.stock_qty,
          ...(variant.price === undefined || variant.price === null ? {} : { Price: variant.price })
        };
        const raw = await this.dataRequestJson<unknown>("product_variants", "", {
          method: "POST",
          body: JSON.stringify(body)
        });
        created.push(this.parseProductVariant(raw));
      }
      return created;
    } catch (error) {
      if (error instanceof ConfigError && String(error.message ?? "").includes("product_variants")) {
        await this.ensureEcomOptionAndVariantTables();
        const existing = await this.listProductVariants(productId);
        for (const row of existing) {
          await this.dataRequestJson<unknown>("product_variants", `/${encodeURIComponent(row.id)}`, { method: "DELETE" });
        }
        const created: ProductVariant[] = [];
        for (const variant of variants) {
          const body = {
            Products_id: Number(productId),
            Options: JSON.stringify(variant.options ?? {}),
            "Stock Qty": variant.stock_qty,
            ...(variant.price === undefined || variant.price === null ? {} : { Price: variant.price })
          };
          const raw = await this.dataRequestJson<unknown>("product_variants", "", {
            method: "POST",
            body: JSON.stringify(body)
          });
          created.push(this.parseProductVariant(raw));
        }
        return created;
      }
      throw error;
    }
  }

  async createOrder(order: Partial<Order> & { id: string }) {
    if (this.schemaProfile === "ecom") {
      const customerName = encodeEcomOrderCustomerName(order.customer_name ?? "Customer", {
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        customer_address: order.customer_address,
        customer_district: order.customer_district,
        special_instructions: order.special_instructions,
        order_ref: order.id,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        payment_id: order.payment_id,
        order_status: order.order_status
      });
      const mapped: Record<string, unknown> = {
        "Customer Name": customerName || "Customer",
        "Order Date": new Date().toISOString(),
        "Total Amount": order.total_amount ?? 0,
        Status: order.order_status ? String(order.order_status).replace(/^\w/, (c) => c.toUpperCase()) : "Pending"
      };
      const raw = await this.dataRequestJson<unknown>("orders", "", {
        method: "POST",
        body: JSON.stringify(mapped)
      });
      const created = this.parseOrder(raw);
      if (process.env.NODE_ENV !== "test") {
        await this.createOrderEvent(created.id, created.order_status ?? "pending", "Order created").catch((error) => {
          console.error("Failed to write order event:", error);
        });
      }
      return created;
    }

    const raw = await this.dataRequestJson<unknown>("orders", "", {
      method: "POST",
      body: JSON.stringify(order)
    });
    const created = this.parseOrder(raw);
    if (process.env.NODE_ENV !== "test") {
      await this.createOrderEvent(created.id, created.order_status ?? "pending", "Order created").catch((error) => {
        console.error("Failed to write order event:", error);
      });
    }
    return created;
  }

  async createOrderItem(item: Omit<OrderItem, "id">, orderRowId?: string | number) {
    if (this.schemaProfile === "ecom") {
      const orderIdNum = Number(item.order_id);
      const rowIdNum = Number(orderRowId);
      const mapped: Record<string, unknown> = {
        "Order ID": item.order_id,
        "Product SKU": item.product_id,
        "Product Name": item.product_name,
        Quantity: item.quantity,
        Price: item.product_price,
        ...(Number.isFinite(rowIdNum) ? { Orders_id: rowIdNum } : Number.isFinite(orderIdNum) ? { Orders_id: orderIdNum } : {})
      };
      const raw = await this.dataRequestJson<unknown>("order_items", "", {
        method: "POST",
        body: JSON.stringify(mapped)
      });
      return this.parseOrderItem(raw);
    }

    const raw = await this.dataRequestJson<unknown>("order_items", "", {
      method: "POST",
      body: JSON.stringify(item)
    });
    return this.parseOrderItem(raw);
  }

  async getOrder(id: string) {
    if (this.schemaProfile === "ecom") {
      const raw = await this.dataRequestJson<unknown>("orders", `/${encodeURIComponent(id)}`);
      return this.parseOrder(raw);
    }
    const row = await this.findOne("orders", `(id,eq,${id})`);
    if (!row) throw new NotFoundError("Order not found");
    return this.parseOrder(row);
  }

  async updateOrder(id: string, patch: Partial<Order>) {
    if (this.schemaProfile === "ecom") {
      const touchesMeta =
        patch.customer_name !== undefined ||
        patch.customer_phone !== undefined ||
        patch.customer_email !== undefined ||
        patch.customer_address !== undefined ||
        patch.customer_district !== undefined ||
        patch.special_instructions !== undefined ||
        patch.payment_method !== undefined ||
        patch.payment_status !== undefined ||
        patch.payment_id !== undefined ||
        patch.order_status !== undefined;

      let existingDisplayName = "Customer";
      let existingMeta: EcomOrderMeta = {};
      if (touchesMeta) {
        const rawExisting = await this.dataRequestJson<unknown>("orders", `/${encodeURIComponent(id)}`);
        const row = unwrapRow(rawExisting);
        const decoded = decodeEcomOrderCustomerName((row as any)?.["Customer Name"]);
        existingDisplayName = decoded.displayName || existingDisplayName;
        existingMeta = decoded.meta || {};
      }

      const mergedDisplayName = (patch.customer_name ?? existingDisplayName).trim() || "Customer";
      const mergedMeta: EcomOrderMeta = {
        ...existingMeta,
        ...(patch.customer_phone !== undefined ? { customer_phone: patch.customer_phone } : {}),
        ...(patch.customer_email !== undefined ? { customer_email: patch.customer_email } : {}),
        ...(patch.customer_address !== undefined ? { customer_address: patch.customer_address } : {}),
        ...(patch.customer_district !== undefined ? { customer_district: patch.customer_district } : {}),
        ...(patch.special_instructions !== undefined ? { special_instructions: patch.special_instructions } : {}),
        ...(patch.payment_method !== undefined ? { payment_method: patch.payment_method } : {}),
        ...(patch.payment_status !== undefined ? { payment_status: patch.payment_status } : {}),
        ...(patch.payment_id !== undefined ? { payment_id: patch.payment_id } : {}),
        ...(patch.order_status !== undefined ? { order_status: patch.order_status } : {})
      };

      const mapped: Record<string, unknown> = {};
      if (touchesMeta) mapped["Customer Name"] = encodeEcomOrderCustomerName(mergedDisplayName, mergedMeta);
      if (patch.total_amount !== undefined) mapped["Total Amount"] = patch.total_amount;
      if (patch.order_status !== undefined) mapped["Status"] = String(patch.order_status).replace(/^\w/, (c) => c.toUpperCase());

      const raw = await this.dataRequestJson<unknown>("orders", `/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(mapped)
      });
      return this.parseOrder(raw);
    }

    const row = await this.findOne("orders", `(id,eq,${id})`, "row_id");
    const rowId =
      typeof (row as any)?.row_id === "number" || typeof (row as any)?.row_id === "string" ? String((row as any).row_id) : null;
    if (!rowId) throw new NotFoundError("Order not found");

    const raw = await this.dataRequestJson<unknown>("orders", `/${encodeURIComponent(rowId)}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
    return this.parseOrder(raw);
  }

  async listOrders(params: { page?: number; pageSize?: number; order_status?: string; payment_status?: string } = {}) {
    const limit = params.pageSize ?? 50;
    const page = params.page ?? 1;
    const offset = Math.max(0, (page - 1) * limit);

    const filters: string[] = [];
    if (this.schemaProfile === "ecom") {
      if (params.order_status) {
        const statusTitle = String(params.order_status).replace(/^\w/, (c) => c.toUpperCase());
        const statusLower = String(params.order_status).toLowerCase();
        const statusUpper = String(params.order_status).toUpperCase();
        filters.push(this.whereIn("Status", Array.from(new Set([statusTitle, statusLower, statusUpper]))));
      }
    } else {
      if (params.order_status) filters.push(`(order_status,eq,${params.order_status})`);
      if (params.payment_status) filters.push(`(payment_status,eq,${params.payment_status})`);
    }
    const where = filters.length ? filters.join("~and") : undefined;

    const fetchPage = async (whereClause?: string) => {
      const raw = await this.dataRequestJson<unknown>("orders", "", undefined, {
        limit,
        offset,
        ...(whereClause ? { where: whereClause } : {})
      });
      const parsed = listResponseSchema.parse(raw);
      return parsed.list.map((row) => this.parseOrder(row));
    };

    if (this.schemaProfile === "ecom" && params.order_status) {
      const expected = String(params.order_status).toLowerCase();
      try {
        const filtered = await fetchPage(where);
        if (filtered.length) return filtered;
      } catch (error) {
        if (!(error instanceof UpstreamError && typeof error.upstreamStatus === "number" && error.upstreamStatus < 500)) {
          throw error;
        }
      }
      const all = await fetchPage(undefined);
      return all.filter((o) => String(o.order_status ?? "").toLowerCase() === expected);
    }

    return fetchPage(where);
  }

  async listOrderItems(orderId: string) {
    if (this.schemaProfile !== "ecom") {
      const raw = await this.dataRequestJson<unknown>("order_items", "", undefined, {
        where: `(order_id,eq,${orderId})`
      });
      const parsed = listResponseSchema.parse(raw);
      return parsed.list.map((row) => this.parseOrderItem(row));
    }

    const tryWhere = async (where: string) => {
      const raw = await this.dataRequestJson<unknown>("order_items", "", undefined, { where });
      const parsed = listResponseSchema.parse(raw);
      return parsed.list.map((row) => this.parseOrderItem(row));
    };

    const idNum = Number(orderId);
    const candidates = [
      ...(Number.isFinite(idNum) ? [this.whereEq("Orders_id", idNum)] : []),
      this.whereEq("Order ID", String(orderId)),
      this.whereEq("order_id", String(orderId)),
      this.whereEq("Order Id", String(orderId))
    ];

    let lastError: unknown = null;
    for (const where of Array.from(new Set(candidates))) {
      try {
        const items = await tryWhere(where);
        if (items.length) return items;
      } catch (error) {
        if (error instanceof UpstreamError && typeof error.upstreamStatus === "number" && error.upstreamStatus < 500) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    if (lastError) throw lastError;
    return [];
  }

  async createOrderEvent(orderId: string, status: string, note?: string | null) {
    const body: Record<string, unknown> = {
      "Order ID": String(orderId),
      Status: String(status)
    };
    if (note) body["Note"] = String(note);

    try {
      const raw = await this.dataRequestJson<unknown>("order_events", "", {
        method: "POST",
        body: JSON.stringify(body)
      });
      return this.parseOrderEvent(raw);
    } catch (error) {
      if (error instanceof ConfigError && String(error.message ?? "").includes("order_events")) {
        await this.ensureOrderEventsTable();
        const raw = await this.dataRequestJson<unknown>("order_events", "", {
          method: "POST",
          body: JSON.stringify(body)
        });
        return this.parseOrderEvent(raw);
      }
      throw error;
    }
  }

  async listOrderEvents(orderId: string) {
    try {
      const raw = await this.dataRequestJson<unknown>("order_events", "", undefined, {
        where: this.whereEq("Order ID", String(orderId)),
        limit: 200,
        offset: 0
      });
      const parsed = listResponseSchema.parse(raw);
      const events = parsed.list.map((row) => this.parseOrderEvent(row));
      return events.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    } catch (error) {
      if (error instanceof ConfigError && String(error.message ?? "").includes("order_events")) {
        await this.ensureOrderEventsTable();
        return [];
      }
      if (error instanceof NotFoundError) return [];
      throw error;
    }
  }
}
