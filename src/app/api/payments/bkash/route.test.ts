describe("/api/payments/bkash", () => {
  it("returns 422 for invalid payload", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/payments/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/payments/bkash", {
        method: "POST",
        body: JSON.stringify({ nope: true })
      })
    );
    expect(res.status).toBe(422);
  }, 15000);

  it("returns 400 for invalid JSON", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/payments/bkash/route");
    const res = await POST(new Request("http://example.test/api/payments/bkash", { method: "POST", body: "{" }));
    expect(res.status).toBe(400);
  });

  it("returns 503 when not configured", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/payments/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/payments/bkash", { method: "POST", body: JSON.stringify({ orderId: "ORD-1" }) })
    );
    expect(res.status).toBe(503);
  });

  it("initiates payment when configured", async () => {
    vi.resetModules();

    const updateOrder = vi.fn().mockResolvedValue({});
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getOrder() {
          return {
            id: "ORD-1",
            total_amount: 1000,
            customer_email: "a@b.com",
            customer_phone: "+880123456789",
            payment_method: "bkash"
          };
        }
        updateOrder = updateOrder;
      }
    }));

    const { POST } = await import("@/app/api/payments/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/payments/bkash", { method: "POST", body: JSON.stringify({ orderId: "ORD-1" }) })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.paymentUrl).toContain("/pay/mock");
    expect(updateOrder).toHaveBeenCalled();
    vi.unmock("@/lib/nocodb");
  });

  it("returns 502 when NocoDB fails", async () => {
    vi.resetModules();
    const { UpstreamError } = await import("@/lib/api/errors");

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getOrder() {
          throw new UpstreamError({ service: "nocodb", status: 500 });
        }
      }
    }));

    const { POST } = await import("@/app/api/payments/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/payments/bkash", { method: "POST", body: JSON.stringify({ orderId: "ORD-1" }) })
    );
    expect(res.status).toBe(502);
    vi.unmock("@/lib/nocodb");
  });
});
