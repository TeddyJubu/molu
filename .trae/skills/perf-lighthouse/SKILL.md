---
name: "perf-lighthouse"
description: "Optimizes Lighthouse and runtime performance. Invoke when pages feel slow, CLS occurs, images are heavy, or before releases."
---

# Performance + Lighthouse

## Purpose

Hit PRD performance goals:
- Lighthouse Performance ≥ 90
- LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms (staging baseline)

## When to Invoke

Invoke this skill when:
- Adding image-heavy components (product listing/detail)
- Introducing client-side fetching or large bundles
- Seeing layout shift or slow navigation
- Preparing staging/production releases

## Optimization Playbook

- Prefer server components for data fetching where feasible.
- Use Next/Image with correct `sizes` and avoid unbounded height.
- Paginate product listing; avoid fetching entire catalog.
- Cache responses where safe (products/categories).
- Avoid shipping large dependencies to client.

## Performance Verification

- Lighthouse run on listing and detail pages.
- Measure API p95 latency for products and orders endpoints.

