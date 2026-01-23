import { NocoDBClient, isNocoConfigured } from "@/lib/nocodb";
import { ConfigError, NotFoundError, UpstreamError } from "@/lib/api/errors";

function okJson(data: unknown) {
  return {
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data),
    status: 200,
    statusText: "OK"
  } as any;
}

function notOk(status: number, text: string) {
  return {
    ok: false,
    json: async () => ({ error: text }),
    text: async () => text,
    status,
    statusText: "Bad"
  } as any;
}

describe("NocoDBClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NOCODB_API_URL: "http://nocodb.test", NOCODB_API_TOKEN: "t", NOCODB_PROJECT_ID: "p" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("detects configuration", () => {
    expect(isNocoConfigured()).toBe(true);
  });

  it("lists products", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okJson({
          list: [{ id: 1, name: "Onesie", price: 500, sizes: ["6M"], colors: ["White"] }]
        })
      )
    );

    const client = new NocoDBClient();
    const products = await client.listProducts({ page: 1, pageSize: 10, is_active: true });
    expect(products).toEqual([{ id: "1", name: "Onesie", price: 500, sizes: ["6M"], colors: ["White"] }]);
  });

  it("gets product details, images, and inventory", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(okJson({ id: "1", name: "Onesie", price: 500, sizes: ["6M"], colors: ["White"] }))
      .mockResolvedValueOnce(
        okJson({
          list: [
            { id: "img2", product_id: "1", image_url: "b", display_order: 2, is_primary: false },
            { id: "img1", product_id: "1", image_url: "a", display_order: 1, is_primary: true }
          ]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [{ id: "inv1", product_id: "1", size: "6M", color: "White", stock_qty: 10 }]
        })
      );

    const client = new NocoDBClient();
    const product = await client.getProductById("1");
    const images = await client.listProductImages("1");
    const inventory = await client.listInventory("1");

    expect(product.id).toBe("1");
    expect(images[0].id).toBe("img1");
    expect(inventory[0].stock_qty).toBe(10);
  });

  it("creates and updates an order", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          id: "ORD-1",
          customer_name: "A",
          customer_phone: "+880123456789",
          customer_email: "a@b.com",
          customer_address: "Addr",
          customer_district: "Dhaka",
          total_amount: 1000,
          payment_method: "bkash",
          payment_status: "pending",
          order_status: "pending"
        })
      )
      .mockResolvedValueOnce(
        okJson({
          row_id: 1
        })
      )
      .mockResolvedValueOnce(
        okJson({
          id: "ORD-1",
          customer_name: "A",
          customer_phone: "+880123456789",
          customer_email: "a@b.com",
          customer_address: "Addr",
          customer_district: "Dhaka",
          total_amount: 1000,
          payment_method: "bkash",
          payment_status: "completed",
          order_status: "confirmed"
        })
      );

    const client = new NocoDBClient();
    const created = await client.createOrder({
      id: "ORD-1",
      customer_name: "A",
      customer_phone: "+880123456789",
      customer_email: "a@b.com",
      customer_address: "Addr",
      customer_district: "Dhaka",
      total_amount: 1000,
      payment_method: "bkash",
      payment_status: "pending",
      order_status: "pending"
    } as any);

    const updated = await client.updateOrder("ORD-1", { payment_status: "completed", order_status: "confirmed" } as any);
    expect(created.id).toBe("ORD-1");
    expect(updated.payment_status).toBe("completed");
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({ method: "PATCH" }));
  });

  it("lists orders and order items", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [
            {
              id: "ORD-1",
              customer_name: "A",
              customer_phone: "+880123456789",
              customer_email: "a@b.com",
              customer_address: "Addr",
              customer_district: "Dhaka",
              total_amount: 1000,
              payment_method: "bkash",
              payment_status: "pending",
              order_status: "pending"
            }
          ]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [
            {
              id: "1",
              order_id: "ORD-1",
              product_id: "p1",
              product_name: "Onesie",
              product_price: 500,
              size: "6M",
              color: "White",
              quantity: 2,
              subtotal: 1000
            }
          ]
        })
      );

    const client = new NocoDBClient();
    const orders = await client.listOrders({ order_status: "pending" });
    expect(orders).toHaveLength(1);
    const items = await client.listOrderItems("ORD-1");
    expect(items[0].subtotal).toBe(1000);
  });

  it("creates an order item", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okJson({
          id: "item-1",
          order_id: "ORD-1",
          product_id: "p1",
          product_name: "Onesie",
          product_price: 500,
          size: "6M",
          color: "White",
          quantity: 1,
          subtotal: 500
        })
      )
    );

    const client = new NocoDBClient();
    const created = await client.createOrderItem({
      order_id: "ORD-1",
      product_id: "p1",
      product_name: "Onesie",
      product_price: 500,
      size: "6M",
      color: "White",
      quantity: 1,
      subtotal: 500
    });
    expect(created.id).toBe("item-1");
  });

  it("lists products admin and updates product", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [{ row_id: 10, id: 1, name: "Onesie", price: 500, is_active: 1 }]
        })
      )
      .mockResolvedValueOnce(okJson({ row_id: 10 }))
      .mockResolvedValueOnce(
        okJson({
          id: "1",
          name: "Onesie",
          price: 500,
          sizes: "6M,9M",
          colors: '["White","Blue"]',
          is_active: 0
        })
      );

    const client = new NocoDBClient();
    const list = await client.listProductsAdmin();
    expect(list[0]?.id).toBe("1");
    const updated = await client.updateProduct("1", { is_active: false });
    expect(updated.sizes).toEqual(["6M", "9M"]);
    expect(updated.colors).toEqual(["White", "Blue"]);
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({ method: "PATCH" }));
  });

  it("throws ConfigError when env is missing", () => {
    process.env = { ...originalEnv, NOCODB_API_URL: "", NOCODB_API_TOKEN: "", NOCODB_PROJECT_ID: "" };
    expect(() => new NocoDBClient()).toThrow(ConfigError);
  });

  it("maps 404 to NotFoundError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(notOk(404, "missing")));
    const client = new NocoDBClient();
    await expect(client.getProductById("nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when updateOrder cannot resolve row_id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okJson({})));
    const client = new NocoDBClient();
    await expect(client.updateOrder("ORD-404", { order_status: "confirmed" } as any)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws on upstream errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(notOk(500, "boom")));
    const client = new NocoDBClient();
    await expect(client.listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });
});
