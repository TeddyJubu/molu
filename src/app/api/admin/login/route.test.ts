import { POST, DELETE } from "./route";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("/api/admin/login", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, ADMIN_BASIC_AUTH: "admin:password" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  describe("POST", () => {
    it("returns 500 if ADMIN_BASIC_AUTH is not configured", async () => {
      delete process.env.ADMIN_BASIC_AUTH;
      const req = new Request("http://localhost/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: "password" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe("Admin auth not configured");
    });

    it("returns 401 for invalid credentials", async () => {
      const req = new Request("http://localhost/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: "wrong", password: "password" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid credentials");
    });

    it("returns 200 and sets cookie for valid credentials", async () => {
      const req = new Request("http://localhost/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: "password" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      const setCookie = res.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("admin_session=true");
      expect(setCookie.toLowerCase()).toContain("httponly");
    });

    it("returns 500 on internal error", async () => {
       const req = {
         json: vi.fn().mockRejectedValue(new Error("Boom"))
       } as any;
       const res = await POST(req);
       expect(res.status).toBe(500);
    });
  });

  describe("DELETE", () => {
    it("deletes the admin_session cookie", async () => {
      const res = await DELETE();
      expect(res.status).toBe(200);
      const setCookie = res.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("admin_session=");
    });
  });
});
