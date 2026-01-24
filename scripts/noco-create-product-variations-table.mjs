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
 
  const already =
    tables.find((t) => t?.table_name === "product_variations") ??
    tables.find((t) => t?.title === "Product Variations") ??
    null;
 
  if (already?.id) {
    process.stdout.write(`exists=true\n`);
    process.stdout.write(`table_id=${already.id}\n`);
    return;
  }
 
  const body = {
    title: "Product Variations",
    table_name: "product_variations",
    type: "table",
    source_id: sourceId,
    columns: [
      { title: "Id", column_name: "Id", uidt: "ID" },
      { title: "Products_id", column_name: "Products_id", uidt: "Number" },
      { title: "Age Range", column_name: "age_range", uidt: "SingleLineText" },
      { title: "Color", column_name: "color", uidt: "SingleLineText" },
      { title: "Stock Qty", column_name: "stock_qty", uidt: "Number" }
    ]
  };
 
  const created = await request(baseUrl, token, `/api/v2/meta/bases/${projectId}/tables`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
 
  process.stdout.write(`exists=false\n`);
  process.stdout.write(`table_id=${created?.id ?? ""}\n`);
}
 
main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
