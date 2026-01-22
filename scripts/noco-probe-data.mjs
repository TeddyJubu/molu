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
const baseUrl = (env.NOCODB_API_URL || "").replace(/\/+$/, "");
const token = env.NOCODB_API_TOKEN;
const projectId = env.NOCODB_PROJECT_ID;

if (!baseUrl || !token || !projectId) {
  throw new Error("Missing NOCODB_API_URL / NOCODB_API_TOKEN / NOCODB_PROJECT_ID in .env.local");
}

const url = `${baseUrl}/nc/${projectId}/api/v1/products?limit=10&offset=0`;
const res = await fetch(url, { headers: { "xc-auth": token } });
const text = await res.text();
console.log("status", res.status);
console.log(text.slice(0, 1000));

