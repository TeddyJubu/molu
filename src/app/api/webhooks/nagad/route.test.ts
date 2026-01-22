describe("/api/webhooks/nagad", () => {
  it("returns 422 for invalid payload", async () => {
    vi.resetModules();
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {}
    }));
    const { POST } = await import("@/app/api/webhooks/nagad/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/nagad", {
        method: "POST",
        body: JSON.stringify({ nope: true })
      })
    );
    expect(res.status).toBe(422);
    vi.unmock("@/lib/nocodb");
  }, 15000);

  it("returns 503 when not configured", async () => {
    vi.resetModules();
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => false,
      NocoDBClient: class {}
    }));
    const { POST } = await import("@/app/api/webhooks/nagad/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/nagad", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "completed" })
      })
    );
    expect(res.status).toBe(503);
    vi.unmock("@/lib/nocodb");
  });

  it("idempotently accepts duplicate completed webhooks", async () => {
    vi.resetModules();

    const updateOrder = vi.fn();
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getOrder() {
          return {
            id: "ORD-1",
            payment_status: "completed",
            payment_id: "P",
            customer_email: "a@b.com",
            customer_phone: "+880123456789",
            total_amount: 1000,
            payment_method: "nagad"
          };
        }
        updateOrder = updateOrder;
      }
    }));

    const { POST } = await import("@/app/api/webhooks/nagad/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/nagad", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "completed" })
      })
    );
    expect(res.status).toBe(200);
    expect(updateOrder).not.toHaveBeenCalled();
    vi.unmock("@/lib/nocodb");
  });

  it("returns 409 on payment ID mismatch", async () => {
    vi.resetModules();

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getOrder() {
          return {
            id: "ORD-1",
            payment_status: "pending",
            payment_id: "P-REAL",
            customer_email: "a@b.com",
            customer_phone: "+880123456789",
            total_amount: 1000,
            payment_method: "nagad"
          };
        }
      }
    }));

    const { POST } = await import("@/app/api/webhooks/nagad/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/nagad", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P-OTHER", status: "completed" })
      })
    );
    expect(res.status).toBe(409);
    vi.unmock("@/lib/nocodb");
  });

  it("updates order on failed payment", async () => {
    vi.resetModules();

    const updateOrder = vi.fn().mockResolvedValue({});
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getOrder() {
          return {
            id: "ORD-1",
            payment_status: "pending",
            payment_id: "P",
            customer_email: "a@b.com",
            customer_phone: "+880123456789",
            total_amount: 1000,
            payment_method: "nagad"
          };
        }
        updateOrder = updateOrder;
      }
    }));

    const { POST } = await import("@/app/api/webhooks/nagad/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/nagad", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "failed" })
      })
    );
    expect(res.status).toBe(200);
    expect(updateOrder).toHaveBeenCalledWith("ORD-1", expect.objectContaining({ payment_status: "failed" }));
    vi.unmock("@/lib/nocodb");
  });
});
