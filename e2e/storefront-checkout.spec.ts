import { test, expect } from "@playwright/test";

test("storefront checkout and mock payment", async ({ page }) => {
  await page.goto("/products");
  await expect(page).toHaveURL(/\/products/);

  const search = page.getByLabel("Search products");
  await search.fill("Tee");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/products\?.*query=Tee/);
  await expect(page.getByRole("heading", { name: "Everyday Gray Tee" }).first()).toBeVisible();

  await page.getByRole("heading", { name: "Everyday Gray Tee" }).first().click();
  await expect(page).toHaveURL(/\/products\/6/);
  await page.getByRole("button", { name: "Add to Cart" }).click();

  await page.getByRole("button", { name: "Open cart" }).click();
  await expect(page.getByText("Shopping Cart")).toBeVisible();
  const cartDialog = page.getByRole("dialog");
  await expect(cartDialog.getByText("Everyday Gray Tee")).toBeVisible();

  await cartDialog.getByRole("button", { name: "View Cart" }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByRole("heading", { name: "Your Cart" })).toBeVisible();
  await expect(page.getByText("Everyday Gray Tee")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Everyday Gray Tee")).toBeVisible();

  await page.getByRole("link", { name: "Proceed to Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  await page.getByLabel("Full Name").fill("Test Customer");
  await page.reload();
  await expect(page.getByLabel("Full Name")).toHaveValue("Test Customer");
  await page.getByLabel("Phone Number").fill("+880123456789");
  await page.getByLabel("Email").fill("test@example.com");
  await page.locator("button[role=\"combobox\"]").first().click();
  await page.getByRole("option", { name: "Dhaka" }).click();
  await page.getByLabel("Delivery Address").fill("House 1, Road 2");
  await page.getByRole("button", { name: "Continue to Payment" }).click();

  await expect(page.getByText("Select Payment Method")).toBeVisible();
  await page.locator('input[type="radio"][value="bkash"]').check();
  
  const placeOrderButton = page.getByRole("button", { name: "Place Order" });
  await placeOrderButton.click();

  try {
    await page.waitForURL(/\/pay\/mock\?gateway=bkash/, { timeout: 30000 });
  } catch {
    const errorLocator = page
      .getByRole("alert")
      .filter({ hasText: /Upstream|NocoDB|not reachable/i })
      .first();
    const error = await errorLocator.textContent().catch(() => null);
    if (error) {
      test.skip(true, error.trim());
    }
    throw new Error(error || "Checkout did not redirect to payment");
  }
  await expect(page.getByText("Mock Payment (bkash)")).toBeVisible();

  await page.getByRole("button", { name: "Fail" }).click();
  await expect(page).toHaveURL(/\/order\//, { timeout: 30000 });
  await expect(page.getByText("Payment failed")).toBeVisible();
  await page.getByRole("button", { name: "Retry payment" }).click();

  await expect(page).toHaveURL(/\/pay\/mock\?gateway=bkash/, { timeout: 30000 });
  await page.getByRole("button", { name: "Success" }).click();

  await expect(page).toHaveURL(/\/order\//, { timeout: 30000 });
  await expect(page.getByText("Paid")).toBeVisible();
  await expect(page.getByText(/Order ID:/)).toBeVisible();

  await page.getByRole("button", { name: "Open cart" }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});
