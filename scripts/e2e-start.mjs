import fs from "node:fs";
import { execSync, spawn } from "node:child_process";

async function waitForHealth(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const res = await fetch(url).catch(() => null);
    if (res?.ok) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

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

function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const out = [];
  const seen = new Set();
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) {
      out.push(line);
      continue;
    }
    const key = m[1];
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      out.push(`${key}=${updates[key]}`);
      seen.add(key);
    } else {
      out.push(line);
    }
  }
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) out.push(`${key}=${value}`);
  }
  fs.writeFileSync(filePath, out.join("\n"));
}

async function main() {
  const envFile = ".env.local";
  const fileEnv = readEnvFile(envFile);
  for (const [k, v] of Object.entries(fileEnv)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }

  const nocoUrl = (process.env.NOCODB_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");
  if (!process.env.NOCODB_URL) process.env.NOCODB_URL = nocoUrl;
  const allowLocalSeed = process.env.NOCODB_USE_LOCAL_SEED === "true";
  const allowBootstrap = process.env.NOCODB_AUTO_BOOTSTRAP === "true" || allowLocalSeed;
  const allowDestructiveSetup = process.env.NOCODB_ALLOW_DESTRUCTIVE_SETUP === "true";
  const isLocal = (() => {
    try {
      const url = new URL(nocoUrl);
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  })();
  const cloudMode = process.env.NOCODB_CLOUD === "true" || !isLocal;

  const children = [];
  const shutdown = () => {
    for (const child of children) child.kill("SIGTERM");
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const healthUrl = `${nocoUrl}/api/v1/health`;
  const healthRes = await fetch(healthUrl).catch(() => null);
  if (!healthRes || !healthRes.ok) {
    if (cloudMode || !allowLocalSeed) {
      throw new Error(
        `NocoDB is not reachable at ${nocoUrl}. Set NOCODB_USE_LOCAL_SEED=true to start .nocodb-seed locally, or fix your Cloud URL.`
      );
    }
    const port = new URL(nocoUrl).port || "8080";
    const seed = spawn("npm", ["run", "start"], {
      stdio: "inherit",
      cwd: ".nocodb-seed",
      env: { ...process.env, PORT: port }
    });
    children.push(seed);

    const ok = await waitForHealth(healthUrl, 120_000);
    if (!ok) throw new Error(`NocoDB did not become healthy at ${nocoUrl}`);
  }

  if (!process.env.NOCODB_API_TOKEN || !process.env.NOCODB_PROJECT_ID) {
    if (!allowBootstrap) {
      throw new Error("Missing NOCODB_API_TOKEN or NOCODB_PROJECT_ID and auto bootstrap is disabled.");
    }
    const bootstrapOut = execSync("node scripts/noco-bootstrap.mjs", {
      env: process.env,
      encoding: "utf8"
    });
    const token = bootstrapOut
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.startsWith("xc_auth="))
      ?.slice("xc_auth=".length);
    const baseId = bootstrapOut
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.startsWith("base_id="))
      ?.slice("base_id=".length);

    if (!token) throw new Error("NocoDB bootstrap did not return xc_auth token");
    if (!baseId) throw new Error("NocoDB bootstrap did not return base_id");

    process.env.NOCODB_API_TOKEN = token;
    process.env.NOCODB_PROJECT_ID = baseId;
    updateEnvFile(envFile, { NOCODB_API_TOKEN: token, NOCODB_PROJECT_ID: baseId });
  }

  if (allowDestructiveSetup) {
    execSync("node scripts/noco-setup-molu.mjs", {
      stdio: "inherit",
      env: process.env
    });
  }

  execSync("npm run build", {
    stdio: "inherit",
    env: process.env
  });

  const child = spawn("npm", ["run", "start"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "3004", NODE_ENV: "test", ALLOW_MOCK_WEBHOOKS: "true" }
  });

  children.push(child);
  child.on("exit", (code) => {
    shutdown();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
