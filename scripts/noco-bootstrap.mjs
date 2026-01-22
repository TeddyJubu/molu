const baseUrl = process.env.NOCODB_URL || "http://localhost:8080";
const email = process.env.NOCODB_ADMIN_EMAIL || "molu.dev@local.test";
const password = process.env.NOCODB_ADMIN_PASSWORD || "DevPassw0rd!";

async function parseBody(res) {
  const text = await res.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

async function post(path, body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { "xc-auth": token } : {})
    },
    body: JSON.stringify(body)
  });
  const bodyParsed = await parseBody(res);
  return { res, ...bodyParsed };
}

async function get(path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: token ? { "xc-auth": token } : {}
  });
  const bodyParsed = await parseBody(res);
  return { res, ...bodyParsed };
}

async function main() {
  const health = await get("/api/v1/health");
  if (!health.res.ok) {
    throw new Error(`NocoDB health check failed (${health.res.status}): ${health.text}`);
  }

  const signup = await post("/api/v1/auth/user/signup", { email, password });
  process.stdout.write(`signup_status=${signup.res.status}\n`);

  const signin = await post("/api/v1/auth/user/signin", { email, password });
  if (!signin.res.ok) {
    throw new Error(`signin failed (${signin.res.status}): ${signin.text}`);
  }

  const token = signin.json?.token ?? signin.json?.authToken ?? signin.json?.data?.token ?? null;
  if (!token) {
    throw new Error(`signin response did not include token: ${signin.text}`);
  }

  const bases = await get("/api/v2/meta/bases", token);
  process.stdout.write(`bases_status=${bases.res.status}\n`);
  if (!bases.res.ok) {
    throw new Error(`bases failed (${bases.res.status}): ${bases.text}`);
  }

  const list = Array.isArray(bases.json?.list) ? bases.json.list : Array.isArray(bases.json) ? bases.json : [];
  const first = list[0] || null;
  if (!first?.id) {
    process.stdout.write("base_id=\n");
  } else {
    process.stdout.write(`base_id=${first.id}\n`);
  }

  process.stdout.write(`xc_auth=${token}\n`);
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});

