import fs from "node:fs";

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2];
  }
  return env;
}

function required(env, name) {
  const value = env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function requestJson(baseUrl, pathname, token) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    headers: token
      ? {
          "xc-auth": token,
          "xc-token": token,
          "content-type": "application/json"
        }
      : { "content-type": "application/json" }
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${text}`);
  return json;
}

function parseUiIds(uiUrl) {
  if (!uiUrl) return [];
  try {
    const url = new URL(uiUrl);
    const hash = url.hash?.startsWith("#/") ? url.hash.slice(2) : "";
    const parts = hash.split("/").filter(Boolean);
    return parts.slice(0, 3);
  } catch {
    return [];
  }
}

async function main() {
  const env = { ...readEnvFile(".env.local"), ...process.env };
  const baseUrl = required(env, "NOCODB_API_URL").replace(/\/+$/, "");
  const token = required(env, "NOCODB_API_TOKEN");
  const uiUrl = env.NOCODB_UI_URL;
  const uiIds = parseUiIds(uiUrl);

  await requestJson(baseUrl, "/api/v1/health", token);

  const basesRaw = await requestJson(baseUrl, "/api/v2/meta/bases", token);
  const bases = Array.isArray(basesRaw?.list) ? basesRaw.list : Array.isArray(basesRaw) ? basesRaw : [];

  process.stdout.write(`api_url=${baseUrl}\n`);
  process.stdout.write(`bases_count=${bases.length}\n`);

  const candidateFromEnv = env.NOCODB_PROJECT_ID;
  const candidates = new Set([candidateFromEnv, ...uiIds].filter(Boolean));

  let selectedBaseId = null;
  for (const id of candidates) {
    if (bases.some((b) => b?.id === id)) {
      selectedBaseId = id;
      break;
    }
  }
  if (!selectedBaseId) {
    const pPrefixed = bases.find((b) => typeof b?.id === "string" && b.id.startsWith("p"))?.id ?? null;
    selectedBaseId = bases.length === 1 ? bases[0]?.id ?? null : pPrefixed;
  }

  if (!selectedBaseId) {
    process.stdout.write("recommended_NOCODB_PROJECT_ID=\n");
  } else {
    process.stdout.write(`recommended_NOCODB_PROJECT_ID=${selectedBaseId}\n`);
  }

  for (const base of bases) {
    const baseId = base?.id ?? "";
    const baseTitle = base?.title ?? base?.name ?? "";
    process.stdout.write(`\nbase_id=${baseId} title=${baseTitle}\n`);

    if (!baseId) continue;
    const tablesRaw = await requestJson(baseUrl, `/api/v1/db/meta/projects/${baseId}/tables`, token);
    const tables = Array.isArray(tablesRaw?.list) ? tablesRaw.list : [];

    for (const table of tables) {
      const title = table?.title ?? "";
      const id = table?.id ?? "";
      process.stdout.write(`table title=${title} id=${id}\n`);
    }
  }
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
