## Goal
Implement PRD MVP flows end-to-end: product listing + detail, cart UI, checkout (delivery + payment selection), order creation in NocoDB, payment initiation + webhook-driven status updates.

## Current State (Baseline)
- Cart store exists: [cart.ts](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/store/cart.ts)
- Order payload Zod schema exists: [validation.ts](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/lib/validation.ts)
- Only stub pages + health API exist: [page.tsx](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/app/page.tsx), [health route](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/app/api/health/route.ts)
- PRD target routes/components are not implemented yet (no `src/components/*`, no `src/app/products|cart|checkout|order`).

## Architecture (Matches PRD)
- **App Router pages**
  - `/products` listing, `/products/[id]` detail, `/cart`, `/checkout`, `/order/[id]`.
- **Server routes (Next Route Handlers)**
  - `GET /api/products`, `GET /api/products/[id]`
  - `POST /api/orders`, `GET /api/orders/[id]`
  - `POST /api/payments/bkash`, `POST /api/payments/nagad`
  - `POST /api/webhooks/bkash`, `POST /api/webhooks/nagad`
  - Shapes follow [API.md](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/docs/API.md).
- **Data layer (server-only)**
  - `src/lib/nocodb.ts` using `NOCODB_API_URL`, `NOCODB_API_TOKEN`, and a required `NOCODB_PROJECT_ID` (PRD uses `/nc/[project-id]/...`).
  - Zod-validated mapping for upstream responses.
- **Payments layer**
  - Gateway adapter interface (`bkash`/`nagad`) so initiation + webhook verification are isolated.
  - Idempotent webhook processing: order update is a single “source of truth” (store `payment_id`, `payment_status`).

## Phase 1 — Catalog (Listing + Detail)
1. Create shared types in `src/types/index.ts` (Product, ProductImage, InventoryItem, Order, OrderItem).
2. Implement NocoDB client wrapper (`src/lib/nocodb.ts`) + thin catalog API:
   - `listProducts({ category, search, page, pageSize, is_active })`
   - `getProductDetail(id)` returning `{ product, images, inventory }`
3. Implement route handlers:
   - `src/app/api/products/route.ts` (GET list)
   - `src/app/api/products/[id]/route.ts` (GET detail)
4. Build UI components:
   - `src/components/product/ProductCard.tsx`, `ProductGrid.tsx`, `ProductDetail.tsx`, `ProductImages.tsx` (PRD section “Product Components”).
5. Build pages:
   - `src/app/products/page.tsx`
   - `src/app/products/[id]/page.tsx`
6. Tests (TDD):
   - Component tests for ProductCard/ProductGrid
   - Route handler tests for `/api/products` and `/api/products/[id]` (validate query parsing + error paths)

## Phase 2 — Cart UI (Store Already Exists)
1. Add cart UI components:
   - `src/components/cart/CartItem.tsx`, `CartSummary.tsx`, `CartDrawer.tsx`.
2. Add routes:
   - `src/app/cart/page.tsx` (full cart page)
3. Wire “Add to cart” from ProductCard and ProductDetail to `useCart.addItem` using the existing variant-aware identity (productId+size+color).
4. Add an app header layout (`src/components/layout/Header.tsx`) showing cart count + link to `/cart`.
5. Tests:
   - Component interaction tests (increment/decrement, remove, totals) using Testing Library.

## Phase 3 — Checkout + Orders (Persist to NocoDB)
1. Add checkout components per PRD:
   - `src/components/checkout/DeliveryForm.tsx` (React Hook Form + Zod)
   - `src/components/checkout/PaymentSelector.tsx`
   - `src/components/checkout/OrderSummary.tsx`
2. Add checkout page:
   - `src/app/checkout/page.tsx` with step flow: delivery → payment → redirect.
3. Implement orders API:
   - `src/app/api/orders/route.ts` (POST create)
   - `src/app/api/orders/[id]/route.ts` (GET detail for tracking)
4. Order correctness rules:
   - Do not trust client-provided totals.
   - Server recomputes total by fetching each product price from NocoDB + applying quantities.
   - Persist `order_items` with denormalized `product_name` and `product_price` (per PRD schema).
5. Tests:
   - Validate request payloads via existing [orderSchema](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/src/lib/validation.ts) (may expand schema to include denormalized fields or keep server-side fill-in).
   - Orders API tests: success, validation 400, upstream/NocoDB failure 502/500.

## Phase 4 — Payments (bKash + Nagad) + Webhooks (Idempotent)
1. Create payment adapters:
   - `src/lib/payments/bkash.ts`, `src/lib/payments/nagad.ts` exposing:
     - `initiatePayment({ orderId, amount }) -> { paymentUrl, paymentId }`
     - `verifyWebhook(req) -> { ok, event }`
2. Implement payment initiation routes:
   - `src/app/api/payments/bkash/route.ts`
   - `src/app/api/payments/nagad/route.ts`
   - Both lookup order in NocoDB, use server-computed `amount`, and store `payment_id` + `payment_status=pending`.
3. Implement webhook routes:
   - `src/app/api/webhooks/bkash/route.ts`
   - `src/app/api/webhooks/nagad/route.ts`
   - Verify authenticity, ensure idempotency (if `payment_status` already `completed`, return 200), then update order status.
4. Provide a safe local dev mode:
   - If gateway secrets are missing, use a “mock gateway” adapter that returns a local redirect URL and a predictable webhook payload so the UI and order-state transitions can be tested without real credentials.
5. Tests:
   - Unit tests for adapter parsing + signature checks.
   - Route tests for idempotent webhook behavior (duplicate webhook doesn’t double-update).

## Cross-Cutting Requirements
- **Dependencies to add (PRD-aligned):** `axios`, `react-hook-form`, `@hookform/resolvers` (and later shadcn/ui components as needed).
- **Accessibility:** form labels, focus states, keyboard-operable radio/select; avoid `alert()` in final UI.
- **Traceability:** update [TRACEABILITY.md](file:///Users/teddyburtonburger/Desktop/Code-hub/molu/docs/TRACEABILITY.md) to reflect what’s already implemented (cart store + validation) and map each new page/route/component + tests to FR-001…FR-011.
- **Coverage:** keep ≥80% overall; payment/webhook modules aim higher due to risk.

## Deliverable Definition (What “Done” Means)
- User can browse `/products`, open `/products/[id]`, add variants to cart, manage cart at `/cart`, complete checkout at `/checkout`, get redirected to a payment URL, and order status updates via webhook flow; `/order/[id]` shows order + items.

If you confirm this plan, I’ll start implementing Phase 1 immediately (including tests) and keep traceability updated as we go.