describe("/api/products/[id]", () => {
  it("returns 503 when NocoDB is not configured", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/products/[id]/route");
    const res = await GET(new Request("http://example.test/api/products/1"), { params: { id: "1" } });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/NocoDB is not configured/);
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
    expect(body.product.id).toBe("1");
    vi.unmock("@/lib/nocodb");
  });

  it("returns 502 when NocoDB throws", async () => {
    vi.resetModules();

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        async getProductById() {
          throw new Error("boom");
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
