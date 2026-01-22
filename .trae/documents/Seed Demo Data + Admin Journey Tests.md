## Goal
- Seed NocoDB with demo products + demo orders so admin pages have real data.
- Add automated “admin journey” tests that cover auth gating and core admin operations.

## Demo Data (NocoDB)
- Extend [noco-setup-molu.mjs](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/scripts/noco-setup-molu.mjs) to seed:
  - 6–10 products with a mix of `is_active=true/false`.
  - 1–3 images per product in `product_images` (Pexels URLs or placeholders).
  - Inventory rows per product (multiple sizes/colors) in `product_inventory`.
  - 8–15 orders in `orders` spanning:
    - `order_status`: pending/confirmed/shipped/delivered/cancelled
    - `payment_status`: pending/completed (and optionally failed)
  - 1–3 order_items per order in `order_items` referencing seeded products.
- Use deterministic demo IDs (e.g., `PROD-DEMO-001`, `ORD-DEMO-001`) so links like `/admin/orders/[id]` are stable.
- Keep the script’s current “fresh tables” behavior (delete + recreate) so reruns are consistent for demos.

## Admin Journey Test Plan (Automated)
- Add a single integration-style test suite (Vitest) that exercises the admin flow without needing Playwright.
- Minimal refactor to make server actions testable:
  - Extract `updateOrderStatus` and `setProductActive` from
    - [admin/orders/page.tsx](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/app/admin/orders/page.tsx)
    - [admin/orders/[id]/page.tsx](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/app/admin/orders/%5Bid%5D/page.tsx)
    - [admin/products/page.tsx](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/app/admin/products/page.tsx)
  - into an exported module like `src/app/admin/_actions.ts` so tests can import and call them.
- Tests to include:
  - Middleware gate:
    - Redirects `/admin/*` to `/admin/login` when `admin_session` cookie is missing.
    - Allows through when cookie is present.
  - Login/logout:
    - Reuse existing API tests; add one “happy-path” test that validates cookie behavior end-to-end in the journey suite.
  - Admin overview:
    - Mock `NocoDBClient.listOrders()` to return a mix of statuses and assert the rendered counts.
  - Orders list + update:
    - Mock `NocoDBClient.listOrders()` renders rows.
    - Call extracted `updateOrderStatus(formData)` and assert `nocodb.updateOrder()` + `revalidatePath()` calls.
  - Order detail:
    - Mock `getOrder()` + `listOrderItems()` renders customer + items.
  - Products + toggle:
    - Mock `listProductsAdmin()` renders rows.
    - Call extracted `setProductActive(formData)` and assert `nocodb.updateProduct()` + revalidation calls.

## Manual Smoke Check (After Seeding)
- Start local NocoDB (the existing `.nocodb-seed` runner) and ensure `.env.local` contains `NOCODB_API_URL`, `NOCODB_API_TOKEN`, `NOCODB_PROJECT_ID`.
- Run the seeding script.
- Verify in the browser:
  - `/admin/login` → log in
  - `/admin` shows counts
  - `/admin/products` toggles active state
  - `/admin/orders` lists orders + status update works
  - `/admin/orders/[id]` renders items + status update works
  - Logout returns to login and blocks `/admin/*`

## Implementation & Verification
- Implement the seeding additions and the small server-action extraction.
- Add the admin journey test suite.
- Run `npm run test:coverage` to ensure ≥80% thresholds still pass.
- Run `npm run build` to ensure Next 15 build stays clean (admin routes remain `dynamic = "force-dynamic"`).