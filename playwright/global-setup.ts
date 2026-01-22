import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function loadEnvFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

export default async function globalSetup() {
  loadEnvFromFile(path.join(process.cwd(), ".env.local"));

  const nocoUrl = (process.env.NOCODB_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");
  if (!process.env.NOCODB_URL) process.env.NOCODB_URL = nocoUrl;
  const healthRes = await fetch(`${nocoUrl}/api/v1/health`).catch(() => null);
  if (!healthRes || !healthRes.ok) {
    throw new Error(`NocoDB is not reachable at ${nocoUrl}. Start .nocodb-seed before running e2e.`);
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

  if (!token) {
    throw new Error("NocoDB bootstrap did not return xc_auth token");
  }
  process.env.NOCODB_API_TOKEN = token;
  if (baseId) process.env.NOCODB_PROJECT_ID = baseId;

  execSync("node scripts/noco-setup-molu.mjs", {
    stdio: "inherit",
    env: process.env
  });
}
