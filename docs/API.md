# API Specification (MVP)

This spec is derived from the PRD folder structure and API examples.

## Products

### `GET /api/products`

- Purpose: List products for store browsing.
- Query: `category`, `search`, `page`, `pageSize`, `is_active`.
- Response: `{ items: ProductSummary[], pageInfo }`

### `GET /api/products/:id`

- Purpose: Product detail page.
- Response: `{ product, images, inventory }`

## Orders

### `POST /api/orders`

- Purpose: Create order + order items.
- Validation: Zod `orderSchema` (PRD validation example).
- Response: `{ id }`

### `GET /api/orders/:id`

- Purpose: Order tracking page.
- Response: `{ order, items }`

## Payments

### `POST /api/payments/bkash`
### `POST /api/payments/nagad`

- Purpose: Initiate payment session.
- Request: `{ orderId, amount }`
- Response: `{ paymentUrl, paymentId }`

## Webhooks

### `POST /api/webhooks/bkash`
### `POST /api/webhooks/nagad`

- Purpose: Process payment confirmation callbacks.
- Requirements: verify authenticity, idempotent processing, update order status, trigger notifications.

