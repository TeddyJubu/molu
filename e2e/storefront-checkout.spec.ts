import { test, expect } from "@playwright/test";

test("storefront checkout and mock payment", async ({ page }) => {
  await page.goto("/products/1");
  await expect(page).toHaveURL(/\/products\/1/);
  await page.getByRole("button", { name: "Add to Cart" }).click();

  await page.getByRole("button", { name: "Open cart" }).click();
  await expect(page.getByText("Shopping Cart")).toBeVisible();

  await page.getByRole("button", { name: "View Cart" }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByRole("heading", { name: "Your Cart" })).toBeVisible();

  await page.getByRole("link", { name: "Proceed to Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  await page.getByLabel("Full Name").fill("Test Customer");
  await page.getByLabel("Phone Number").fill("+880123456789");
  await page.getByLabel("Email").fill("test@example.com");
  await page.locator("button[role=\"combobox\"]").first().click();
  await page.getByRole("option", { name: "Dhaka" }).click();
  await page.getByLabel("Delivery Address").fill("House 1, Road 2");
  await page.getByRole("button", { name: "Continue to Payment" }).click();

  await expect(page.getByText("Select Payment Method")).toBeVisible();
  await page.locator('input[type="radio"][value="bkash"]').check();
  
  const placeOrderButton = page.getByRole("button", { name: "Place Order" });
  
  page.on("console", msg => {
    if (msg.type() === "error") console.log("PAGE ERROR:", msg.text());
  });
  
  page.on("pageerror", err => {
    console.log("PAGE EXCEPTION:", err.message);
  });
  
  await placeOrderButton.click();
  
  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  console.log("Current URL after clicking Place Order:", currentUrl);
  
  if (currentUrl.includes("/checkout")) {
    const errorElement = await page.locator('[role="alert"]').first().isVisible().catch(() => false);
    if (errorElement) {
      const errorText = await page.locator('[role="alert"]').first().textContent();
      console.log("Error message on page:", errorText);
      if (errorText?.includes("NocoDB") || errorText?.includes("not reachable")) {
        test.skip(true, "NocoDB is not reachable - skipping payment test");
      }
    }
  }

  await expect(page).toHaveURL(/\/pay\/mock\?gateway=bkash/, { timeout: 30000 });
  await expect(page.getByText("Mock Payment (bkash)")).toBeVisible();
  
  await page.getByRole("button", { name: "Success" }).click();

  await expect(page).toHaveURL(/\/order\//, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: /Order ORD-/ })).toBeVisible();
  await expect(page.getByText(/Status:/)).toBeVisible();
});
