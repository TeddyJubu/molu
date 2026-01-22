describe("/api/products/[id]", () => {
  it("returns 503 when NocoDB is not configured", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/products/[id]/route");
    const res = await GET(new Request("http://example.test/api/products/1"), { params: { id: "1" } });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.message).toMatch(/NocoDB is not configured/);
  });

  it("returns product detail when configured", async () => {
    vi.resetModules();

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getProductById() {
          return { id: "1", name: "Onesie", price: 500, sizes: ["6M"], colors: ["White"] };
        }
        async listProductImages() {
          return [];
        }
        async listInventory() {
          return [];
        }
      }
    }));

    const { GET } = await import("@/app/api/products/[id]/route");
    const res = await GET(new Request("http://example.test/api/products/1"), { params: { id: "1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.product.id).toBe("1");
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
        async listProductImages() {
          return [];
        }
        async listInventory() {
          return [];
        }
      }
    }));

    const { GET } = await import("@/app/api/products/[id]/route");
    const res = await GET(new Request("http://example.test/api/products/1"), { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(502);
    vi.unmock("@/lib/nocodb");
  });
});
