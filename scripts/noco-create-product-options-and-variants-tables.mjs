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

async function parseBody(res) {
  const text = await res.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

async function request(baseUrl, token, path, init) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(token ? { "xc-auth": token, "xc-token": token } : {}),
      ...(init?.headers ?? {})
    }
  });
  const parsed = await parseBody(res);
  if (!res.ok) throw new Error(`${init?.method || "GET"} ${path} -> ${res.status}: ${parsed.text}`);
  return parsed.json;
}

function findTable(tables, { table_name, title }) {
  return (
    tables.find((t) => t?.table_name === table_name) ??
    tables.find((t) => t?.title === title) ??
    null
  );
}

async function ensureTable({ baseUrl, token, projectId, sourceId, title, table_name, columns }) {
  const tables = (await request(baseUrl, token, `/api/v1/db/meta/projects/${projectId}/tables`)).list ?? [];
  const already = findTable(tables, { table_name, title });
  if (already?.id) return { exists: true, table_id: already.id };

  const body = {
    title,
    table_name,
    type: "table",
    source_id: sourceId,
    columns
  };

  const created = await request(baseUrl, token, `/api/v2/meta/bases/${projectId}/tables`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { exists: false, table_id: created?.id ?? "" };
}

async function ensureColumn({ baseUrl, token, tableId, column }) {
  const meta = await request(baseUrl, token, `/api/v1/db/meta/tables/${encodeURIComponent(tableId)}`);
  const columns = meta?.columns ?? [];
  const exists =
    columns.some((c) => String(c?.title ?? "").toLowerCase() === String(column.title).toLowerCase()) ||
    columns.some((c) => String(c?.column_name ?? "").toLowerCase() === String(column.column_name).toLowerCase());
  if (exists) return { exists: true };

  await request(baseUrl, token, `/api/v1/db/meta/tables/${encodeURIComponent(tableId)}/columns`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(column)
  });
  return { exists: false };
}

async function main() {
  const env = readEnvFile(".env.local");
  const baseUrl = String(env.NOCODB_API_URL || "http://localhost:8080").replace(/\/+$/, "");
  const token = env.NOCODB_API_TOKEN;
  const projectId = env.NOCODB_PROJECT_ID;

  if (!projectId) throw new Error("Missing NOCODB_PROJECT_ID in .env.local");
  if (!token || token === "replace_me") throw new Error("Missing NOCODB_API_TOKEN in .env.local");

  const tables = (await request(baseUrl, token, `/api/v1/db/meta/projects/${projectId}/tables`)).list ?? [];
  const sourceId = tables[0]?.source_id;
  if (!sourceId) throw new Error("Could not determine source_id for base");

  const productOptions = await ensureTable({
    baseUrl,
    token,
    projectId,
    sourceId,
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

  const productVariants = await ensureTable({
    baseUrl,
    token,
    projectId,
    sourceId,
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

  let productVariantsPriceColumn = { exists: true };
  if (productVariants.table_id) {
    productVariantsPriceColumn = await ensureColumn({
      baseUrl,
      token,
      tableId: productVariants.table_id,
      column: { title: "Price", column_name: "price", uidt: "Number" }
    });
  }

  process.stdout.write(`product_options.exists=${productOptions.exists}\n`);
  process.stdout.write(`product_options.table_id=${productOptions.table_id}\n`);
  process.stdout.write(`product_variants.exists=${productVariants.exists}\n`);
  process.stdout.write(`product_variants.table_id=${productVariants.table_id}\n`);
  process.stdout.write(`product_variants.price_column.exists=${productVariantsPriceColumn.exists}\n`);
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
