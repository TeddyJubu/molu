## Current Status
- Traceability matrix shows FR-001..FR-011, FR-014..FR-015, FR-017 marked Completed; FR-019 In progress.
- Admin route is protected via middleware, but the admin page is still a placeholder.

## Remaining Requirements
- FR-019: Finish error handling (API + UI).
- FR-012: Email notifications via Loops (Not started).
- FR-013: WhatsApp notifications (Not started).
- FR-016: Mobile responsiveness + Lighthouse ≥90 (Not started).
- FR-018: Admin dashboard (Not started; only scaffolding exists).
- Test gaps to close: add/confirm tests for “Completed” items that currently have blank tests (FR-002, FR-003, FR-007, FR-011, FR-015) or adjust their status.

## What To Do Next (Recommended Order)
1. Complete FR-019 (Error handling)
   - Standardize route handler responses (shape, status codes, error codes) across `src/app/api/*`.
   - Ensure NocoDB/payment clients return typed/structured errors (no raw throws leaking).
   - Add consistent UI error states for checkout/payment/order pages.
   - Add missing tests for known failure paths (NocoDB down, invalid payloads, webhook duplicates).
2. Implement FR-012 (Loops email)
   - Add a notifications module and provider wrapper.
   - Trigger emails from order lifecycle: order created, payment initiated, payment confirmed (webhook), payment failed.
   - Make events idempotent (webhooks may retry) and ensure PII is handled safely.
   - Add tests around event emission + idempotency.
3. Implement FR-016 (Mobile + Lighthouse)
   - Responsive pass across storefront/cart/checkout/order tracking.
   - Performance pass: image strategy, route-level loading states, minimize client JS.
   - Define a repeatable Lighthouse measurement workflow (and optionally a CI check).
4. Implement FR-013 (WhatsApp)
   - Add behind a feature flag and reuse the same lifecycle events as email.
   - Add idempotency + retry/backoff rules.
5. Implement FR-018 (Admin dashboard)
   - Start read-only: orders list, order detail, payment status, inventory view.
   - Then mutations: update inventory, mark order statuses, manage catalog.
   - Keep current Basic Auth middleware gating as the first security layer.
6. Fill remaining test coverage holes + re-run coverage gate
   - Add tests for any “Completed” requirement without tests.
   - Confirm `npm run test:coverage` stays ≥80%.

## Acceptance Checks
- FR-019: API errors are consistent and UI surfaces actionable messages.
- FR-012/013: Notifications fire exactly-once per lifecycle event (idempotent under retries).
- FR-016: Mobile layout works on common breakpoints; Lighthouse ≥90 documented and reproducible.
- FR-018: Admin has at least a functional orders + inventory interface.
- Tests: coverage gate passes and traceability statuses match reality.

## Key Dependencies / Inputs Needed
- Loops API key + template IDs (or a documented mock mode for dev/tests).
- WhatsApp provider credentials + approved message templates (or stubbed adapter for dev).
- A stable staging dataset in NocoDB to measure performance and admin flows.
