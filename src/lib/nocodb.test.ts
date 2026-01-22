import { NocoDBClient, isNocoConfigured } from "@/lib/nocodb";

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
  });

  it("throws on upstream errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(notOk(500, "boom")));
    const client = new NocoDBClient();
    await expect(client.listProducts()).rejects.toThrow(/NocoDB request failed/);
  });
});
