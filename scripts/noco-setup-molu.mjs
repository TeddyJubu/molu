import fs from "node:fs";

function readEnvFile(path) {
  const env = {};
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2];
  }
  return env;
}

const env = readEnvFile(".env.local");
const baseUrl = (env.NOCODB_API_URL || "http://localhost:8080").replace(/\/+$/, "");
const token = env.NOCODB_API_TOKEN;
const projectId = env.NOCODB_PROJECT_ID;

if (!token || !projectId) {
  throw new Error("Missing NOCODB_API_TOKEN or NOCODB_PROJECT_ID in .env.local");
}

async function request(path, init) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(token ? { "xc-auth": token, "xc-token": token } : {}),
      ...(init?.headers ?? {})
    }
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    throw new Error(`${init?.method || "GET"} ${path} -> ${res.status}: ${text}`);
  }
  return { res, text, json };
}

async function ensureFreshTable({ title, table_name, columns, source_id }) {
  const tables = (await request(`/api/v1/db/meta/projects/${projectId}/tables`)).json?.list ?? [];
  const existing = tables.find((t) => t?.title === title);
  if (existing?.id) {
    await request(`/api/v1/db/meta/tables/${existing.id}`, { method: "DELETE" });
  }

  const created = await request(`/api/v2/meta/bases/${projectId}/tables`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, table_name, type: "table", source_id, columns })
  });
  return created.json?.id ?? null;
}

async function main() {
  await request("/api/v1/health");

  const tablesResp = await request(`/api/v1/db/meta/projects/${projectId}/tables`);
  const tables = tablesResp.json?.list ?? [];
  const sourceId = tables[0]?.source_id;
  if (!sourceId) throw new Error("Could not determine source_id");

  await ensureFreshTable({
    title: "products",
    table_name: "products",
    source_id: sourceId,
    columns: [
      { title: "id", column_name: "id", uidt: "ID" },
      { title: "name", column_name: "name", uidt: "SingleLineText" },
      { title: "description", column_name: "description", uidt: "LongText" },
      { title: "price", column_name: "price", uidt: "Number" },
      { title: "original_price", column_name: "original_price", uidt: "Number" },
      { title: "brand", column_name: "brand", uidt: "SingleLineText" },
      { title: "sizes", column_name: "sizes", uidt: "SingleLineText" },
      { title: "colors", column_name: "colors", uidt: "SingleLineText" },
      { title: "is_active", column_name: "is_active", uidt: "Checkbox" },
      { title: "stock_status", column_name: "stock_status", uidt: "SingleLineText" }
    ]
  });

  await ensureFreshTable({
    title: "product_images",
    table_name: "product_images",
    source_id: sourceId,
    columns: [
      { title: "id", column_name: "id", uidt: "ID" },
      { title: "product_id", column_name: "product_id", uidt: "Number" },
      { title: "image_url", column_name: "image_url", uidt: "SingleLineText" },
      { title: "display_order", column_name: "display_order", uidt: "Number" },
      { title: "is_primary", column_name: "is_primary", uidt: "Checkbox" }
    ]
  });

  await ensureFreshTable({
    title: "product_inventory",
    table_name: "product_inventory",
    source_id: sourceId,
    columns: [
      { title: "id", column_name: "id", uidt: "ID" },
      { title: "product_id", column_name: "product_id", uidt: "Number" },
      { title: "size", column_name: "size", uidt: "SingleLineText" },
      { title: "color", column_name: "color", uidt: "SingleLineText" },
      { title: "stock_qty", column_name: "stock_qty", uidt: "Number" },
      { title: "low_stock_threshold", column_name: "low_stock_threshold", uidt: "Number" }
    ]
  });

  await ensureFreshTable({
    title: "orders",
    table_name: "orders",
    source_id: sourceId,
    columns: [
      { title: "row_id", column_name: "row_id", uidt: "ID" },
      { title: "id", column_name: "id", uidt: "SingleLineText" },
      { title: "customer_name", column_name: "customer_name", uidt: "SingleLineText" },
      { title: "customer_phone", column_name: "customer_phone", uidt: "SingleLineText" },
      { title: "customer_email", column_name: "customer_email", uidt: "SingleLineText" },
      { title: "customer_address", column_name: "customer_address", uidt: "LongText" },
      { title: "customer_district", column_name: "customer_district", uidt: "SingleLineText" },
      { title: "special_instructions", column_name: "special_instructions", uidt: "LongText" },
      { title: "total_amount", column_name: "total_amount", uidt: "Number" },
      { title: "payment_method", column_name: "payment_method", uidt: "SingleLineText" },
      { title: "payment_status", column_name: "payment_status", uidt: "SingleLineText" },
      { title: "payment_id", column_name: "payment_id", uidt: "SingleLineText" },
      { title: "order_status", column_name: "order_status", uidt: "SingleLineText" }
    ]
  });

  await ensureFreshTable({
    title: "order_items",
    table_name: "order_items",
    source_id: sourceId,
    columns: [
      { title: "row_id", column_name: "row_id", uidt: "ID" },
      { title: "order_id", column_name: "order_id", uidt: "SingleLineText" },
      { title: "product_id", column_name: "product_id", uidt: "Number" },
      { title: "product_name", column_name: "product_name", uidt: "SingleLineText" },
      { title: "product_price", column_name: "product_price", uidt: "Number" },
      { title: "size", column_name: "size", uidt: "SingleLineText" },
      { title: "color", column_name: "color", uidt: "SingleLineText" },
      { title: "quantity", column_name: "quantity", uidt: "Number" },
      { title: "subtotal", column_name: "subtotal", uidt: "Number" }
    ]
  });

  await request(`/api/v1/db/data/v1/${projectId}/products`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Onesie",
      description: "Soft cotton onesie",
      price: 500,
      original_price: null,
      brand: "Molu",
      sizes: "6M,12M",
      colors: "White,Blue",
      is_active: 1,
      stock_status: "in_stock"
    })
  });

  await request(`/api/v1/db/data/v1/${projectId}/products`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "T-Shirt",
      description: "Comfy everyday tee",
      price: 250,
      original_price: 300,
      brand: "Molu",
      sizes: "2Y,3Y,4Y",
      colors: "Red,Blue",
      is_active: 1,
      stock_status: "in_stock"
    })
  });

  const products = (await request(`/api/v1/db/data/v1/${projectId}/products?limit=10&offset=0`)).json?.list ?? [];
  const first = products[0];
  if (first?.id) {
    await request(`/api/v1/db/data/v1/${projectId}/product_inventory`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        product_id: first.id,
        size: "6M",
        color: "White",
        stock_qty: 10,
        low_stock_threshold: 3
      })
    });
  }

  process.stdout.write("ok\n");
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});

