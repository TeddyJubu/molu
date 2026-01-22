import { parseProductsQuery } from "@/lib/productsQuery";

describe("/api/products", () => {
  it("parses query params with defaults and bounds", () => {
    const url = new URL("http://example.test/api/products?page=2&pageSize=500&is_active=false");
    expect(parseProductsQuery(url)).toEqual({ page: 2, pageSize: 100, is_active: false });
  });

  it("returns 503 when NocoDB is not configured", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const res = await GET(new Request("http://example.test/api/products"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/NocoDB is not configured/);
  });

  it("returns products when configured", async () => {
    vi.resetModules();

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async listProducts() {
          return [{ id: "1", name: "Onesie", price: 500, sizes: ["6M"], colors: ["White"], image: null }];
        }
      }
    }));

    const { GET } = await import("@/app/api/products/route");
    const res = await GET(new Request("http://example.test/api/products?page=1&pageSize=10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    vi.unmock("@/lib/nocodb");
  });

  it("returns 502 on upstream errors", async () => {
    vi.resetModules();

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async listProducts() {
          throw new Error("upstream");
        }
      }
    }));

    const { GET } = await import("@/app/api/products/route");
    const res = await GET(new Request("http://example.test/api/products"));
    expect(res.status).toBe(502);
    vi.unmock("@/lib/nocodb");
  });
});
