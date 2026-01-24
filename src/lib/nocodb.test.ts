import { NocoDBClient, isNocoConfigured } from "@/lib/nocodb";
import { ConfigError, NotFoundError, UpstreamError } from "@/lib/api/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("maps fetch failures to a friendly UpstreamError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const client = new NocoDBClient();
    await expect(client.listProducts()).rejects.toMatchObject({
      service: "nocodb",
      message: expect.stringMatching(/NocoDB is not reachable/)
    });
  });
});

describe("NocoDBClient (Ecom schema profile)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NOCODB_API_URL: "http://nocodb.test",
      NOCODB_API_TOKEN: "t",
      NOCODB_PROJECT_ID: "p",
      NOCODB_SCHEMA_PROFILE: "ecom",
      NOCODB_DATA_API_MODE: "org-table-id",
      NOCODB_ORG: "noco"
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("maps Products list into app ProductSummary shape", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [{ id: "mc0ezyw89h4gpbb", title: "Products", table_name: "Products" }]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [{ Id: 1, "Product Name": "Onesie", Description: "Soft", Price: 500, "Is Active": true }]
        })
      );

    const client = new NocoDBClient();
    const products = await client.listProducts({ page: 1, pageSize: 10, is_active: true });
    expect(products).toEqual([{ id: "1", name: "Onesie", price: 500, sizes: [], colors: [] }]);
    expect(String(fetchMock.mock.calls[1]?.[0] ?? "")).toContain("Is+Active");
  });

  it("fetches a product by record id and maps fields", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [{ id: "mc0ezyw89h4gpbb", title: "Products", table_name: "Products" }]
        })
      )
      .mockResolvedValueOnce(okJson({ Id: 2, "Product Name": "T-Shirt", Price: 250, "Is Active": true }));

    const client = new NocoDBClient();
    const product = await client.getProductById("2");
    expect(product).toMatchObject({ id: "2", name: "T-Shirt", price: 250, is_active: true });
  });

  it("maps createOrder and createOrderItem payloads for Ecom base", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [
            { id: "mthmpn9dhu075lf", title: "Orders", table_name: "Orders" },
            { id: "mzmyjydrldz8nxt", title: "Order Items", table_name: "Order Items" }
          ]
        })
      )
      .mockImplementationOnce(async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? "{}"));
        return okJson({ Id: 10, "Customer Name": body["Customer Name"], "Total Amount": body["Total Amount"], Status: body.Status });
      })
      .mockResolvedValueOnce(okJson({ Id: 1, "Order ID": "10", "Product SKU": "SKU-1", Quantity: 1, Price: 500, Orders_id: 10 }));

    const client = new NocoDBClient();
    const order = await client.createOrder({
      id: "IGNORED",
      customer_name: "A",
      customer_phone: "+8801",
      customer_email: "a@b.com",
      customer_address: "addr",
      customer_district: "Dhaka",
      total_amount: 750,
      payment_method: "bkash",
      payment_status: "pending",
      order_status: "pending"
    } as any);
    expect(order.id).toBe("10");
    expect(order.order_status).toBe("pending");
    expect(order.customer_phone).toBe("+8801");
    expect(order.customer_email).toBe("a@b.com");
    expect(order.customer_address).toBe("addr");
    expect(order.customer_district).toBe("Dhaka");
    expect(order.payment_method).toBe("bkash");
    expect(order.payment_status).toBe("pending");

    await client.createOrderItem({
      order_id: "10",
      product_id: "SKU-1",
      product_name: "X",
      product_price: 500,
      size: "One Size",
      color: "Default",
      quantity: 1,
      subtotal: 500
    });

    const body1 = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body ?? "{}"));
    expect(body1).toHaveProperty("Customer Name");
    expect(String(body1["Customer Name"] ?? "")).toContain("||meta:");
    expect(body1).toHaveProperty("Total Amount");
    expect(body1).toHaveProperty("Status");

    const body2 = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body ?? "{}"));
    expect(body2).toMatchObject({ "Order ID": "10", "Product SKU": "SKU-1", "Product Name": "X", Quantity: 1, Price: 500, Orders_id: 10 });
  });

  it("preserves existing order metadata when updating status", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [{ id: "mthmpn9dhu075lf", title: "Orders", table_name: "Orders" }]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          Id: 10,
          "Customer Name": "A ||meta:eyJjdXN0b21lcl9waG9uZSI6Iis4ODAxIn0",
          "Total Amount": 750,
          Status: "Pending"
        })
      )
      .mockImplementationOnce(async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? "{}"));
        return okJson({ Id: 10, "Customer Name": body["Customer Name"], "Total Amount": 750, Status: body.Status });
      });

    const client = new NocoDBClient();
    const updated = await client.updateOrder("10", { order_status: "confirmed" } as any);
    expect(updated.customer_phone).toBe("+8801");
    expect(updated.order_status).toBe("confirmed");
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({ method: "PATCH" }));
  });

  it("maps product_variants to inventory when available", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [
            { id: "mc0ezyw89h4gpbb", title: "Products", table_name: "Products" },
            { id: "mprodvars", title: "Product Variants", table_name: "product_variants" }
          ]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [{ Id: 1, Products_id: 2, Options: '{"Age Range":"2Y-3Y","Color":"Blue"}', "Stock Qty": 7, Price: 999 }]
        })
      );

    const client = new NocoDBClient();
    const inventory = await client.listInventory("2");
    expect(inventory).toEqual([{ id: "1", product_id: "2", size: "2Y-3Y", color: "Blue", stock_qty: 7, low_stock_threshold: null }]);
    expect(String(fetchMock.mock.calls[1]?.[0] ?? "")).toContain("mprodvars");
  });

  it("parses variant price from product_variants", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [{ id: "mprodvars", title: "Product Variants", table_name: "product_variants" }]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [{ Id: 1, Products_id: 2, Options: '{"Size":"S"}', "Stock Qty": 7, Price: 250 }]
        })
      );

    const client = new NocoDBClient();
    const variants = await client.listProductVariants("2");
    expect(variants).toEqual([{ id: "1", product_id: "2", options: { Size: "S" }, stock_qty: 7, price: 250 }]);
    expect(String(fetchMock.mock.calls[1]?.[0] ?? "")).toContain("mprodvars");
  });

  it("maps product_variations to inventory when available", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [
            { id: "mc0ezyw89h4gpbb", title: "Products", table_name: "Products" },
            { id: "mprodvar", title: "Product Variations", table_name: "product_variations" }
          ]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [{ Id: 1, Products_id: 2, "Age Range": "2Y-3Y", Color: "Blue", "Stock Qty": 7 }]
        })
      );

    const client = new NocoDBClient();
    const inventory = await client.listInventory("2");
    expect(inventory).toEqual([{ id: "1", product_id: "2", size: "2Y-3Y", color: "Blue", stock_qty: 7, low_stock_threshold: null }]);
    expect(String(fetchMock.mock.calls[1]?.[0] ?? "")).toContain("mprodvar");
  });

  it("falls back to legacy product_variations for variant configuration", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [
            { id: "mc0ezyw89h4gpbb", title: "Products", table_name: "Products" },
            { id: "mprodvar", title: "Product Variations", table_name: "product_variations" }
          ]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [{ Id: 1, Products_id: 2, "Age Range": "2Y-3Y", Color: "Blue", "Stock Qty": 7 }]
        })
      );

    const client = new NocoDBClient();
    const config = await client.getProductVariantConfiguration("2");
    expect(config.source).toBe("product_variations");
    expect(config.options.map((o) => o.name)).toEqual(["Age Range", "Color"]);
    expect(config.variants[0]).toMatchObject({ stock_qty: 7, options: { "Age Range": "2Y-3Y", Color: "Blue" } });
    expect(String(fetchMock.mock.calls[1]?.[0] ?? "")).toContain("mprodvar");
  });

  it("lists, creates, updates, and deletes product variations", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        okJson({
          list: [{ id: "mprodvar", title: "Product Variations", table_name: "product_variations" }]
        })
      )
      .mockResolvedValueOnce(
        okJson({
          list: [{ Id: 1, Products_id: 2, "Age Range": "2Y-3Y", Color: "Blue", "Stock Qty": 7 }]
        })
      )
      .mockImplementationOnce(async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? "{}"));
        return okJson({ Id: 2, Products_id: body.Products_id, "Age Range": body["Age Range"], Color: body.Color, "Stock Qty": body["Stock Qty"] });
      })
      .mockImplementationOnce(async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? "{}"));
        return okJson({ Id: 2, Products_id: 2, "Age Range": body["Age Range"], Color: body["Color"], "Stock Qty": body["Stock Qty"] });
      })
      .mockResolvedValueOnce(okJson({}));

    const client = new NocoDBClient();

    const existing = await client.listProductVariations("2");
    expect(existing).toEqual([{ id: "1", product_id: "2", age_range: "2Y-3Y", color: "Blue", stock_qty: 7 }]);

    const created = await client.createProductVariation({ product_id: "2", age_range: "3Y-4Y", color: "Blue", stock_qty: 1 });
    expect(created).toMatchObject({ id: "2", product_id: "2", age_range: "3Y-4Y", color: "Blue", stock_qty: 1 });

    const updated = await client.updateProductVariation("2", { stock_qty: 9 });
    expect(updated.stock_qty).toBe(9);

    await client.deleteProductVariation("2");

    expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({ method: "POST" }));
    expect(fetchMock.mock.calls[3]?.[1]).toEqual(expect.objectContaining({ method: "PATCH" }));
    expect(fetchMock.mock.calls[4]?.[1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  });
});
