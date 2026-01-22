describe("/api/orders", () => {
  it("returns 422 for invalid payload", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/orders/route");
    const res = await POST(
      new Request("http://example.test/api/orders", {
        method: "POST",
        body: JSON.stringify({ not: "an order" })
      })
    );
    expect(res.status).toBe(422);
  }, 15000);

  it("returns 400 for invalid JSON", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/orders/route");
    const res = await POST(
      new Request("http://example.test/api/orders", {
        method: "POST",
        body: "{"
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 503 when configured payload but NocoDB missing", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/orders/route");
    const res = await POST(
      new Request("http://example.test/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: "Ab",
          customer_phone: "+880123456789",
          customer_email: "a@b.com",
          customer_address: "Address",
          customer_district: "Dhaka",
          items: [{ productId: "p1", quantity: 1, size: "6M", color: "White" }],
          total_amount: 500,
          payment_method: "bkash"
        })
      })
    );
    expect(res.status).toBe(503);
  });

  it("creates an order and order items with computed total", async () => {
    vi.resetModules();
    const createOrder = vi.fn().mockResolvedValue({ id: "ORD-1" });
    const createOrderItem = vi.fn().mockResolvedValue({ id: "item-1" });
    const getProductById = vi.fn().mockImplementation(async (id: string) => {
      if (id === "p1") return { id: "p1", name: "Onesie", price: 500 };
      return { id: "p2", name: "T-Shirt", price: 250 };
    });

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        getProductById = getProductById;
        createOrder = createOrder;
        createOrderItem = createOrderItem;
      }
    }));

    const { POST } = await import("@/app/api/orders/route");
    const res = await POST(
      new Request("http://example.test/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: "Ab",
          customer_phone: "+880123456789",
          customer_email: "a@b.com",
          customer_address: "Address",
          customer_district: "Dhaka",
          items: [
            { productId: "p1", quantity: 2, size: "6M", color: "White" },
            { productId: "p2", quantity: 1, size: "2Y", color: "Blue" }
          ],
          total_amount: 1250,
          payment_method: "bkash"
        })
      })
    );

    expect(res.status).toBe(200);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ total_amount: 1250 }));
    expect(createOrderItem).toHaveBeenCalledTimes(2);
    vi.unmock("@/lib/nocodb");
  });

  it("returns 502 when NocoDB throws", async () => {
    vi.resetModules();
    const { UpstreamError } = await import("@/lib/api/errors");

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getProductById() {
          throw new UpstreamError({ service: "nocodb", status: 500 });
        }
      }
    }));

    const { POST } = await import("@/app/api/orders/route");
    const res = await POST(
      new Request("http://example.test/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: "Ab",
          customer_phone: "+880123456789",
          customer_email: "a@b.com",
          customer_address: "Address",
          customer_district: "Dhaka",
          items: [{ productId: "p1", quantity: 1, size: "6M", color: "White" }],
          total_amount: 500,
          payment_method: "bkash"
        })
      })
    );

    expect(res.status).toBe(502);
    vi.unmock("@/lib/nocodb");
  });
});
