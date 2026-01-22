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

const res = await fetch(`${baseUrl}/api/v1/db/meta/projects/${projectId}/swagger.json`, {
  headers: token ? { "xc-auth": token } : {}
});
const swagger = await res.json();

const paths = Object.keys(swagger.paths || {}).filter((p) => p.toLowerCase().includes("products"));
console.log(paths.join("\n"));

if (paths[0]) {
  console.log("---");
  console.log(paths[0]);
  console.log(JSON.stringify(swagger.paths[paths[0]], null, 2).slice(0, 2000));
}

