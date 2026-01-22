---
name: "tdd-coverage-enforcer"
description: "Enforces TDD loops and ≥80% coverage gates. Invoke when adding features, writing tests, or fixing coverage/CI failures."
---

# TDD + Coverage Enforcer

## Purpose

Keep delivery high-quality and predictable by enforcing:
- Red → Green → Refactor development loop
- Coverage thresholds (minimum 80% lines/functions/branches/statements)
- Testing pyramid balance (unit/component/integration)

## When to Invoke

Invoke this skill when:
- Adding a new component, hook, API route, or lib module
- Tests or coverage fail
- Refactoring behavior-critical logic

## Minimum Test Expectations

- UI components: render + interaction tests (Testing Library)
- Hooks/stores: state transitions and edge cases
- API routes: request validation + success + failure paths
- Validation schemas: happy + unhappy cases

## Coverage Gate Rules

- Do not merge if overall coverage < 80%.
- For touched modules, aim for > 90% where logic is non-trivial (payments/webhooks).

## Common Pitfalls to Avoid

- Testing implementation details instead of behavior
- Skipping error-path tests
- Mocking too deeply (prefer mocking external boundaries only)

