---
name: "nocodb-homebrew-macos"
description: "Sets up a self-hosted NocoDB on macOS using Homebrew and configures this repo to use it. Invoke when local NocoDB is needed for products/orders APIs."
---

# Self-host NocoDB on macOS (Homebrew)

Use this skill to install and run NocoDB locally on macOS via Homebrew, then wire the current project to it by setting `NOCODB_*` environment variables.

## What this project expects

This repo talks to NocoDB using:
- `NOCODB_API_URL` (example: `http://localhost:8080`)
- `NOCODB_API_TOKEN` (created in NocoDB UI → Account Settings → Tokens/API tokens)
- `NOCODB_PROJECT_ID` (aka Base ID / Project ID, visible in the URL as `#/nc/<project_id>` when a base is open)

## Install NocoDB with Homebrew

Prereq: Homebrew installed.

```bash
brew tap nocodb/nocodb
brew install nocodb
```

Run it:

```bash
nocodb
```

Open:
- http://localhost:8080

Update later:

```bash
brew upgrade nocodb
```

## Configure storage (recommended for stability)

If you do nothing, NocoDB will create a local SQLite database in the current working directory.

For a more stable local setup, explicitly set the metadata DB via `NC_DB` and set a fixed JWT secret:

```bash
export NC_AUTH_JWT_SECRET="change-me-locally"
export NC_DB="pg://127.0.0.1:5432?u=<user>&p=<password>&d=<db_name>"
nocodb
```

Notes:
- `NC_DB` is the primary DB where NocoDB stores metadata (and can store data).
- If you don’t want Postgres locally, you can keep SQLite; just ensure you always start `nocodb` from the same directory (or configure SQLite explicitly using `NC_DB_JSON` per the NocoDB docs).

## Create an API token in NocoDB UI

1. Log in to NocoDB.
2. Open the user menu (bottom-left) → Account Settings.
3. Open **Tokens / API Tokens**.
4. Create a token and copy it (save it somewhere secure).

You’ll use it as `NOCODB_API_TOKEN` in this repo.

## Find the Project ID (Base ID)

Open any table in your base and look at the URL:

`http://localhost:8080/#/nc/<project_id>?...`

The `<project_id>` segment is the value to use for `NOCODB_PROJECT_ID`.

## Wire this repo to your local NocoDB

1. Copy:
   - `.env.example` → `.env.local`
2. Set:

```env
NOCODB_API_URL=http://localhost:8080
NOCODB_API_TOKEN=replace_me
NOCODB_PROJECT_ID=replace_me
```

3. Run the app:

```bash
npm run dev
```

## Quick verification checklist

- `GET /api/products` returns 200 (not 503).
- `/products` shows products (once your base has a `products` table populated).
- `POST /api/orders` returns `{ id }` (once `orders` + `order_items` tables exist and permissions allow inserts).

## Troubleshooting

- Port already in use: stop the process using 8080 or run NocoDB on a different port (see NocoDB docs).
- `GET /api/products` returns 503: you didn’t set `NOCODB_API_URL`, `NOCODB_API_TOKEN`, `NOCODB_PROJECT_ID`.
- `Invalid token`: ensure you’re using an API token (header `xc-token` on NocoDB side) and that the user still has access.

