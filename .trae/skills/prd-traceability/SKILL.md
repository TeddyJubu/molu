---
name: "prd-traceability"
description: "Maintains requirement IDs and traceability mapping. Invoke when adding/changing features or tests to keep PRD coverage accurate."
---

# PRD Traceability

## Purpose

Keep implementation and testing aligned to the PRD by maintaining:
- Requirement IDs (FR-###, NFR-###, IT-###, UAT-###)
- A traceability matrix mapping requirements → files/modules/tests
- Explicit acceptance criteria for each requirement

## When to Invoke

Invoke this skill when you:
- Add a new feature, endpoint, page, component, or background job
- Change behavior that could affect acceptance criteria
- Add/modify tests and need to map them back to requirements
- Prepare a release and need to confirm completeness

## Operating Rules

- Every user-facing behavior must have a Requirement ID.
- Every Requirement ID must have at least one automated test reference (unit/integration) unless explicitly deferred and documented.
- Each PR updates the traceability matrix if it changes product behavior.

## Required Artifacts

- `docs/DEVELOPMENT_PLAN.md`: Requirements table and overall plan
- `docs/TRACEABILITY.md`: The living traceability matrix

## Workflow

1. Identify PRD section(s) impacted (architecture, components, database, testing, phases).
2. Assign or update Requirement IDs.
3. Update traceability mappings:
   - Requirement → implementation files
   - Requirement → test files
4. Validate that acceptance criteria are testable and included in UAT list.

## Example Traceability Entry

```markdown
| Req ID | Requirement | Implementation | Tests | Status |
|---|---|---|---|---|
| FR-006 | Checkout delivery form validates BD phone | src/components/checkout/DeliveryForm.tsx | src/__tests__/components/DeliveryForm.test.tsx | In progress |
```

