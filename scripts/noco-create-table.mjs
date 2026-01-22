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
const sourceId = process.env.NOCODB_SOURCE_ID || "bz4xyb06tq61x3q";
const tableName = process.env.NOCODB_TABLE_NAME || "test_ids";

const body = {
  title: tableName,
  table_name: tableName,
  type: "table",
  source_id: sourceId,
  columns: [
    { title: "id", column_name: "id", uidt: "ID" },
    { title: "name", column_name: "name", uidt: "SingleLineText" }
  ]
};

const res = await fetch(`${baseUrl}/api/v2/meta/bases/${projectId}/tables`, {
  method: "POST",
  headers: { "content-type": "application/json", ...(token ? { "xc-auth": token } : {}) },
  body: JSON.stringify(body)
});
const text = await res.text();
console.log("status", res.status);
console.log(text);

