# Security Requirements

## Secrets + PII

- Store secrets only in server environment variables.
- Never commit secrets to the repo.
- Do not log API keys, tokens, webhook payloads containing PII, or full customer addresses.

## Webhooks

- Verify webhook signatures/tokens for bKash and Nagad.
- Implement idempotency to prevent duplicate updates and duplicate notifications.
- Apply rate limiting to webhook endpoints and order creation endpoints.

## Admin Protection

- Any admin-facing page or API must require authentication.
- Use least privilege: customers cannot access admin endpoints.

