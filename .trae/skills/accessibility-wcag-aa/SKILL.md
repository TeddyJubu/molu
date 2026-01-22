---
name: "accessibility-wcag-aa"
description: "Ensures WCAG 2.1 AA compliance for UI and forms. Invoke when building UI components, forms, navigation, or reviewing UX changes."
---

# Accessibility (WCAG 2.1 AA)

## Purpose

Build an inclusive storefront that works with:
- Keyboard navigation
- Screen readers
- Reduced motion preferences
- Sufficient contrast and readable touch targets

## When to Invoke

Invoke this skill when:
- Implementing new UI components/pages
- Building forms (checkout, admin, search/filters)
- Adjusting styling, colors, or interaction patterns

## Checklist (Core)

- Semantic elements used (buttons, links, headings, lists).
- Every form control has a label and error messaging is announced.
- Focus states visible and logical focus order.
- No keyboard traps; ESC closes modals/drawers.
- Color contrast meets AA.
- Images have meaningful `alt` text (decorative images use empty alt).

## Test Ideas

- Keyboard-only checkout completion.
- Screen reader announcement of delivery form errors.
- Tab order through product cards and add-to-cart CTA.

