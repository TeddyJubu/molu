const fs = await import("node:fs");

function readEnvFile(path) {
  const text = fs.readFileSync(path, "utf8");
  const env = {};
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

async function hit(path) {
  const res = await fetch(`${baseUrl}${path}`, { headers: token ? { "xc-auth": token } : {} });
  const text = await res.text();
  console.log(path, "->", res.status, text.slice(0, 200).replace(/\s+/g, " "));
}

const paths = [
  "/api/v1/db/meta/projects",
  `/api/v1/db/meta/projects/${projectId}`,
  `/api/v1/db/meta/projects/${projectId}/tables`,
  "/api/v2/meta/bases",
  `/api/v2/meta/bases/${projectId}`,
  `/api/v2/meta/bases/${projectId}/tables`
];

for (const p of paths) {
  await hit(p);
}

