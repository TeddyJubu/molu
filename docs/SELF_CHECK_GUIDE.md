# Self-Check Guide

Use this guide to verify the repository setup end-to-end on your machine.

## 1) Validate the docs are present

Open these files and confirm they match your expectations:
- [DEVELOPMENT_PLAN](DEVELOPMENT_PLAN.md)
- [TRACEABILITY](TRACEABILITY.md)
- [ENGINEERING_RULES](ENGINEERING_RULES.md)
- [SECURITY](SECURITY.md)
- [API](API.md)

## 2) Validate workspace skills exist

Confirm these files exist:
- `.trae/skills/prd-traceability/SKILL.md`
- `.trae/skills/nocodb-integration/SKILL.md`
- `.trae/skills/payments-bd-gateways/SKILL.md`
- `.trae/skills/tdd-coverage-enforcer/SKILL.md`
- `.trae/skills/accessibility-wcag-aa/SKILL.md`
- `.trae/skills/perf-lighthouse/SKILL.md`
- `.trae/skills/release-ops/SKILL.md`

## 3) Install dependencies

```bash
npm install
```

## 4) Verify security posture (dependency audit)

```bash
npm audit
```

Expected: `found 0 vulnerabilities`.

## 5) Verify tests + coverage gates (≥80%)

```bash
npm run test:coverage
```

Expected:
- Exit code 0
- Coverage summary meets thresholds (lines/functions/branches/statements ≥ 80%)

## 6) Verify production build

```bash
npm run build
```

Expected: build completes successfully.

## 7) Run the app locally and check key routes

1. Create a local env file:
   - Copy `.env.example` → `.env.local`
   - Set `ADMIN_BASIC_AUTH=admin:your_password`

2. Start dev server:

```bash
npm run dev
```

3. Check routes in the browser:
- `http://localhost:3000/` shows the scaffold home page.
- `http://localhost:3000/api/health` returns `{ "ok": true }`.
- `http://localhost:3000/admin` prompts for Basic Auth.

## 8) Validate admin protection behavior

- If `ADMIN_BASIC_AUTH` is missing, `/admin` should return 403.
- If credentials are wrong, `/admin` should return 401 with a Basic Auth prompt.
- If credentials match, `/admin` should render the Admin page.

