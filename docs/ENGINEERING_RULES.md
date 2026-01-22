# Engineering Rules (Non-Negotiable)

These rules exist to maximize delivery success and reduce rework for a junior-led implementation.

## Architecture

- Keep NocoDB tokens and all third-party credentials server-only.
- Centralize external integrations (NocoDB, Loops, payments, WhatsApp) in `lib/*` modules and call them only from server contexts.
- Validate all inbound API payloads with Zod at the route boundary.
- Use a consistent error response shape across API routes.

## TDD + Coverage (PRD-aligned)

- Red → Green → Refactor loop for new work.
- Minimum coverage: 80% lines/functions/branches/statements.
- Every requirement must map to implementation files and tests (see TRACEABILITY).

## UI + Components (PRD-aligned)

- Components must be small, typed, reusable, and testable.
- Prefer shadcn/ui components for accessibility primitives.
- Forms must show accessible validation errors and preserve keyboard navigation.

## Payments + Webhooks

- Webhook handlers must be idempotent (dedupe and safe replays).
- Verify webhook authenticity before updating any order.
- Never trust amounts from the client; reconcile from gateway payloads where feasible.

## Code Review Checklist

- Tests included/updated; behavior-driven assertions.
- Input validation present; no implicit trust of client.
- No secrets/PII leaked in logs; sanitize error output.
- Accessible interactions (keyboard, focus, labels, contrast).
- Performance considered (images, hydration, unnecessary client fetches).

