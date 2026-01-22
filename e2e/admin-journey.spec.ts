import { test, expect } from "@playwright/test";

function adminCreds() {
  const raw = process.env.ADMIN_BASIC_AUTH ?? "admin:admin";
  const [username, password] = raw.split(":");
  return { username: username ?? "admin", password: password ?? "admin" };
}

test("admin login, view orders, update status", async ({ page }) => {
  const { username, password } = adminCreds();
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
  const loginRes = await page.request.post("/api/admin/login", {
    data: { username, password }
  });
  expect(loginRes.status()).toBe(200);
  expect(loginRes.headers()["set-cookie"] ?? "").toContain("admin_session=true");
  await page.context().addCookies([{ name: "admin_session", value: "true", domain: "localhost", path: "/" }]);

  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

  const firstRow = page.locator("tbody tr").first();
  const statusSelect = firstRow.locator("select[name=\"order_status\"]");
  const prev = await statusSelect.inputValue();
  const next = prev === "pending" ? "confirmed" : "pending";

  await statusSelect.selectOption(next);
  await firstRow.getByRole("button", { name: "Update" }).click();

  await expect(statusSelect).toHaveValue(next);
});
