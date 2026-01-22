describe("/api/health", () => {
  it("returns ok status payload", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
  });
});
