---
name: "nocodb-integration"
description: "Builds and validates NocoDB schema + API client mappings. Invoke when creating/debugging data access or API routes touching NocoDB."
---

# NocoDB Integration

## Purpose

Implement stable, typed integration with NocoDB via REST:
- Schema alignment (tables/columns/relationships)
- Server-only client wrapper with predictable error handling
- Mapping from NocoDB payloads → app domain types

## When to Invoke

Invoke this skill when:
- Creating or modifying NocoDB tables/columns
- Implementing `/api/products`, `/api/orders`, inventory operations, or admin CRUD
- Debugging missing fields, wrong names, auth issues, pagination, or filtering

## Security Rules

- NocoDB API token must never be exposed to the browser.
- Ensure all NocoDB calls happen server-side in route handlers or server utilities.

## Design Guidelines

- Centralize all calls in `lib/nocodb.ts` (or equivalent) with typed methods.
- Wrap external errors into consistent API responses:
  - 4xx for validation / not found
  - 5xx for upstream failures
- Validate upstream payloads with Zod when feasible.

## Recommended Method Set

- Products: list, get-by-id
- Categories: list
- Inventory: list-by-product, update
- Orders: create, get, update-status
- OrderItems: create-many

## Example Checklist

- [ ] Auth header set correctly (`xc-auth`)
- [ ] Table and column names match NocoDB exactly
- [ ] Filters and pagination verified
- [ ] Integration tests cover success and failure paths

