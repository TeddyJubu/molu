## What the 2 logs mean (root cause)
- `Error: Not found` from `NocoDBClient.updateOrder()` means the server action tried to update an order row, but the underlying NocoDB “update row by internal row id” call returned 404.
- The `net::ERR_ABORTED` is a symptom: the client aborts the server-action request once the server action throws.

## Goal (realistic promise)
- You can’t guarantee “no errors ever” in production, but you *can* reduce risk to near-zero for known flows by:
  - covering every feature with automated tests
  - running them in CI for every change
  - adding smoke tests + monitoring so regressions are caught immediately

## Phase 0 — Stabilize the admin update bug (blocks confidence)
- Investigate NocoDB row identifier usage for updates (likely mismatch between `row_id` vs Noco’s internal `Id` field).
- Fix `updateOrder()` and `updateProduct()` to use the correct internal row key.
- Add regression tests that reproduce the 404 and prove updates work.

## Phase 1 — Test pyramid (what to test where)
- **Unit tests (fast, most coverage):** pure functions, validation, error mapping.
- **API integration tests (still fast):** Next route handlers with mocked NocoDB + mocked payment providers.
- **UI/component tests:** React components + key interactions.
- **E2E tests (highest confidence):** real browser runs full flows against a seeded NocoDB.

## Phase 2 — Coverage map: “every single feature”
### Storefront (public)
- Home page renders (hero, trending).
- Product listing (`/products`) with search/filter/pagination behavior.
- Product detail (`/products/[id]`): images render, inventory shown, variant selection works.
- Cart (`/cart`): add/remove/update quantity, totals correct, persistence behavior.
- Checkout (`/checkout`):
  - form validation for required fields
  - creates order via `POST /api/orders`
  - handles server validation errors gracefully
- Order tracking (`/order/[id]`):
  - shows order + items
  - not-found and upstream failure states render nicely

### Admin
- Middleware gate: unauthenticated redirects to `/admin/login`.
- Login/logout: cookie set/cleared; protected pages block again after logout.
- Admin overview (`/admin`): counts computed correctly.
- Products (`/admin/products`): list loads, toggle active works, changes reflect in storefront.
- Orders (`/admin/orders`): list loads, filters work, status update works.
- Order detail (`/admin/orders/[id]`): items render; status update works.

### APIs (contract coverage)
- `GET /api/products` and `GET /api/products/[id]`:
  - success
  - not found
  - NocoDB unreachable
- `POST /api/orders`:
  - invalid JSON
  - invalid payload (422)
  - configured vs not configured
  - computes totals from products
- Payments:
  - `POST /api/payments/bkash` and `/api/payments/nagad`: validates inputs and returns expected payload
  - mock provider failures
- Webhooks:
  - invalid signature rejected
  - idempotency (same webhook twice)
  - updates order payment status and triggers notifications

## Phase 3 — Seeded E2E environment (so tests are realistic)
- Use `.nocodb-seed` runner + `scripts/noco-setup-molu.mjs` to create deterministic demo products + orders.
- Add a dedicated “test seed” that always produces the same IDs (stable selectors for E2E).

## Phase 4 — E2E suite (browser-level, catches what unit tests miss)
- Add Playwright-based flows:
  - browse → product → add to cart → checkout → mock pay → order page
  - admin login → products toggle → orders status update → logout
- Add screenshot-on-failure and tracing for flaky issues.

## Phase 5 — CI gates and “never face it again” protections
- CI pipeline gates:
  - `npm run test:coverage` (already enforces ≥80%)
  - `npm run build`
  - E2E suite (at least on main branch; optionally nightly)
- Monitoring plan:
  - server error logging around NocoDB + payments
  - basic uptime/health checks for `/api/health` and NocoDB health

## Deliverables after implementation
- Fixed admin status update bug (no more 404 on update).
- Full automated coverage across store + admin + APIs.
- E2E suite proving real user journeys.
- CI gates so regressions fail before deployment.