---
name: "payments-bd-gateways"
description: "Guides bKash/Nagad integration, webhook idempotency, and sandbox validation. Invoke when implementing or debugging payments/webhooks."
---

# Bangladesh Payment Gateways (bKash + Nagad)

## Purpose

Ensure payment flows are reliable and secure:
- Payment session initiation per gateway
- Webhook verification and idempotent processing
- Safe order state transitions
- Sandbox-first validation

## When to Invoke

Invoke this skill when:
- Adding payment initiation endpoints
- Implementing webhook handlers
- Investigating payment failures, duplicate confirmations, or wrong order state

## Non-Negotiables

- Webhooks must be idempotent (duplicates happen).
- Verify authenticity (signature/token) before updating any order.
- Never trust amounts from the client; reconcile from gateway payloads where possible.
- Keep secrets server-only; do not log credentials or full payloads with PII.

## Suggested State Model

- `payment_status`: `pending | completed | failed`
- `order_status`: `pending | confirmed | shipped | delivered | cancelled`

Allowed transitions (example):
- `pending` → `confirmed` only when `payment_status=completed`
- Any → `cancelled` only with admin authorization

## Webhook Handling Pattern

1. Verify signature/token.
2. Parse event type and payment reference.
3. Look up order by `payment_id` or stored gateway reference.
4. If event already processed, return 200.
5. Update order status atomically.
6. Trigger downstream notifications (email/WhatsApp) after persistence.

## Sandbox Validation Checklist

- [ ] Successful payment updates order
- [ ] Failed payment marks order failed
- [ ] Duplicate webhook does not duplicate emails/messages
- [ ] Replayed webhook is safe (returns 200)

