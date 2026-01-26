import { describe, expect, it, vi } from "vitest";

describe("/api/orders/:id", () => {
  it("returns 503 when NocoDB is not configured", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/orders/[id]/route");
    const res = await GET(new Request("http://example.test/api/orders/ORD-1"), { params: { id: "ORD-1" } } as any);
    expect(res.status).toBe(503);
  }, 10000);

  it("returns order and items when configured", async () => {
    vi.resetModules();

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getOrder(id: string) {
          return {
            id,
            customer_name: "A",
            customer_phone: "+880123456789",
            customer_email: "a@b.com",
            customer_address: "Addr",
            customer_district: "Dhaka",
            special_instructions: null,
            total_amount: 1000,
            payment_method: "bkash",
            payment_status: "pending",
            payment_id: null,
            order_status: "pending"
          };
        }
        async listOrderItems() {
          return [{ id: "i1", order_id: "ORD-1", product_id: "1", product_name: "Onesie", product_price: 500, size: "6M", color: "White", quantity: 2, subtotal: 1000 }];
        }
      }
    }));

    const { GET } = await import("@/app/api/orders/[id]/route");
    const res = await GET(new Request("http://example.test/api/orders/ORD-1"), { params: { id: "ORD-1" } } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.order.id).toBe("ORD-1");
    expect(body.data.items).toHaveLength(1);
    vi.unmock("@/lib/nocodb");
  });

  it("returns 502 on upstream errors", async () => {
    vi.resetModules();
    const { UpstreamError } = await import("@/lib/api/errors");

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getOrder() {
          throw new UpstreamError({ service: "nocodb", status: 500 });
        }
        async listOrderItems() {
          return [];
        }
      }
    }));

    const { GET } = await import("@/app/api/orders/[id]/route");
    const res = await GET(new Request("http://example.test/api/orders/ORD-1"), { params: { id: "ORD-1" } } as any);
    expect(res.status).toBe(502);
    vi.unmock("@/lib/nocodb");
  });
});
