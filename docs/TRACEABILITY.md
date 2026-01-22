# Requirements Traceability Matrix

Source PRD: `Kids_Store_PRD_Junior_Dev.md`

## Functional Requirements

| Req ID | Requirement | PRD Reference | Implementation | Tests | Status |
|---|---|---|---|---|---|
| FR-001 | Browse products (home + listing) | PRD “Folder Structure”, “Phase 1” | src/app/page.tsx; src/app/products/page.tsx; src/components/product/* | src/components/product/ProductGrid.test.tsx | Completed |
| FR-002 | Product detail view | PRD “ProductDetail.tsx” | src/app/products/[id]/page.tsx; src/components/product/ProductDetail.tsx |  | Completed |
| FR-003 | Variant selection (size + color) | PRD “ProductDetail.tsx” | src/components/product/ProductDetail.tsx |  | Completed |
| FR-004 | Add to cart | PRD “ProductCard.tsx”, “CartStore” | src/store/cart.ts; src/app/products/products-client.tsx; src/app/products/[id]/product-detail-client.tsx | src/store/cart.test.ts; src/components/product/ProductCard.test.tsx | Completed |
| FR-005 | Cart management | PRD “CartItem.tsx”, “CartStore” | src/app/cart/page.tsx; src/components/cart/*; src/store/cart.ts | src/store/cart.test.ts; src/components/cart/CartItem.test.tsx | Completed |
| FR-006 | Checkout delivery form + BD phone validation | PRD “DeliveryForm.tsx” | src/app/checkout/page.tsx; src/components/checkout/DeliveryForm.tsx; src/lib/validation.ts | src/lib/validation.test.ts | Completed |
| FR-007 | Payment method selection | PRD “PaymentSelector.tsx” | src/components/checkout/PaymentSelector.tsx; src/app/checkout/page.tsx |  | Completed |
| FR-008 | Create order + items in DB | PRD “orders”, “order_items” tables | src/app/api/orders/*; src/lib/nocodb.ts | src/app/api/orders/route.test.ts | Completed |
| FR-009 | Payment initiation (bKash/Nagad) | PRD payments libs/routes | src/app/api/payments/*; src/lib/payments/* | src/app/api/payments/bkash/route.test.ts; src/app/api/payments/nagad/route.test.ts | Completed |
| FR-010 | Webhook handling | PRD webhook routes | src/app/api/webhooks/* | src/app/api/webhooks/bkash/route.test.ts; src/app/api/webhooks/nagad/route.test.ts | Completed |
| FR-011 | Order tracking page | PRD `/order/[id]` | src/app/order/[id]/page.tsx |  | Completed |
| FR-012 | Email notifications via Loops | PRD Loops section |  |  | Not started |
| FR-013 | WhatsApp notifications | PRD WhatsApp section |  |  | Not started |
| FR-014 | NocoDB-backed catalog | PRD NocoDB tables | src/lib/nocodb.ts; src/app/api/products/* | src/app/api/products/route.test.ts | Completed |
| FR-015 | Inventory per variant | PRD `product_inventory` | src/lib/nocodb.ts; src/app/api/products/[id]/route.ts |  | Completed |
| FR-016 | Mobile + Lighthouse ≥90 | PRD “Success Metrics” |  |  | Not started |
| FR-017 | Coverage ≥80% | PRD `vitest.config.ts` | vitest.config.ts | npm run test:coverage | Completed |
| FR-018 | Admin dashboard (bonus) | PRD Phase 5 | src/app/admin/page.tsx; src/middleware.ts |  | Not started |
| FR-019 | Error handling | PRD “Common pitfalls” | src/app/api/*; src/lib/nocodb.ts; src/app/checkout/page.tsx | src/app/api/*/*.test.ts | In progress |
