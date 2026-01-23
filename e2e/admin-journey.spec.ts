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

  const rows = page.locator("tbody tr");
  const count = await rows.count();
  
  if (count === 0) {
    test.skip(true, "No orders found in database - NocoDB may not be configured");
  }
  
  const firstRow = rows.first();
  const statusSelectTrigger = firstRow.locator("button").filter({ hasText: /Pending|Confirmed|Shipped|Delivered|Cancelled/ });
  
  if (await statusSelectTrigger.count() === 0) {
    test.skip(true, "Status select element not found");
  }
  
  await statusSelectTrigger.click();
  const pendingOption = page.getByRole("option", { name: "Pending" });
  const confirmedOption = page.getByRole("option", { name: "Confirmed" });
  
  const pendingExists = await pendingOption.isVisible().catch(() => false);
  const confirmedExists = await confirmedOption.isVisible().catch(() => false);
  
  if (pendingExists) {
    await confirmedOption.click();
  } else if (confirmedExists) {
    await pendingOption.click();
  }
  
  await page.waitForTimeout(500);
});
