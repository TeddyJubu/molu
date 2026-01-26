describe("/api/webhooks/bkash", () => {
  it("returns 422 for invalid payload", async () => {
    vi.resetModules();
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {}
    }));
    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
        method: "POST",
        body: JSON.stringify({ nope: true })
      })
    );
    expect(res.status).toBe(422);
    vi.unmock("@/lib/nocodb");
  }, 15000);

  it("returns 403 when unauthorized in production", async () => {
    vi.resetModules();
    const prevEnv = process.env;
    process.env = { ...prevEnv, NODE_ENV: "production" };

    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "completed" })
      })
    );
    expect(res.status).toBe(403);
    process.env = prevEnv;
  });

  it("returns 503 when not configured", async () => {
    vi.resetModules();
    const prevEnv = process.env;
    process.env = { ...prevEnv, NODE_ENV: "test" };
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => false,
      NocoDBClient: class {}
    }));

    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "completed" })
      })
    );
    expect(res.status).toBe(503);
    process.env = prevEnv;
    vi.unmock("@/lib/nocodb");
  });

  it("updates order on completed payment", async () => {
    vi.resetModules();

    const updateOrder = vi.fn().mockResolvedValue({});
    const notifyPaymentCompleted = vi.fn().mockResolvedValue(undefined);
    const notifyPaymentFailed = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/notifications", () => ({ notifyPaymentCompleted, notifyPaymentFailed }));
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
            payment_method: "bkash"
          };
        }
        updateOrder = updateOrder;
      }
    }));

    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "completed" })
      })
    );
    expect(res.status).toBe(200);
    expect(updateOrder).toHaveBeenCalledWith("ORD-1", expect.objectContaining({ payment_status: "completed" }));
    expect(updateOrder).toHaveBeenCalledWith("ORD-1", expect.objectContaining({ payment_id: "P" }));
    vi.unmock("@/lib/nocodb");
    vi.unmock("@/lib/notifications");
  });

  it("sets payment method when missing", async () => {
    vi.resetModules();

    const updateOrder = vi.fn().mockResolvedValue({});
    const notifyPaymentCompleted = vi.fn().mockResolvedValue(undefined);
    const notifyPaymentFailed = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/notifications", () => ({ notifyPaymentCompleted, notifyPaymentFailed }));
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
            payment_method: ""
          };
        }
        updateOrder = updateOrder;
      }
    }));

    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "completed" })
      })
    );
    expect(res.status).toBe(200);
    expect(updateOrder).toHaveBeenCalledWith(
      "ORD-1",
      expect.objectContaining({ payment_status: "completed", payment_method: "bkash", payment_id: "P" })
    );
    vi.unmock("@/lib/nocodb");
    vi.unmock("@/lib/notifications");
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
            payment_method: "bkash"
          };
        }
      }
    }));

    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
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
            payment_method: "bkash"
          };
        }
        updateOrder = updateOrder;
      }
    }));

    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "failed" })
      })
    );
    expect(res.status).toBe(200);
    expect(updateOrder).toHaveBeenCalledWith("ORD-1", expect.objectContaining({ payment_status: "failed" }));
    expect(updateOrder).toHaveBeenCalledWith("ORD-1", expect.objectContaining({ payment_id: "P" }));
    vi.unmock("@/lib/nocodb");
  });

  it("returns 502 when NocoDB throws", async () => {
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

    const { POST } = await import("@/app/api/webhooks/bkash/route");
    const res = await POST(
      new Request("http://example.test/api/webhooks/bkash", {
        method: "POST",
        body: JSON.stringify({ orderId: "ORD-1", paymentId: "P", status: "completed" })
      })
    );
    expect(res.status).toBe(502);
    vi.unmock("@/lib/nocodb");
  });
});
