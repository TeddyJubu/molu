import { describe, expect, it } from "vitest";
import { bangladeshPhoneRegex, orderSchema } from "./validation";

describe("validation", () => {
  it("accepts valid Bangladesh phone numbers", () => {
    expect(bangladeshPhoneRegex.test("+880123456789")).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    expect(bangladeshPhoneRegex.test("0123456789")).toBe(false);
    expect(bangladeshPhoneRegex.test("+88012345")).toBe(false);
  });

  it("validates a correct order payload", () => {
    const result = orderSchema.safeParse({
      customer_name: "Test User",
      customer_phone: "+880123456789",
      customer_email: "test@example.com",
      customer_address: "House 1, Road 2",
      customer_district: "Dhaka",
      special_instructions: "Leave at gate",
      items: [{ productId: "p1", quantity: 2, size: "6M", color: "White" }],
      total_amount: 1000,
      payment_method: "bkash"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an order with empty cart", () => {
    const result = orderSchema.safeParse({
      customer_name: "Test User",
      customer_phone: "+880123456789",
      customer_email: "test@example.com",
      customer_address: "House 1, Road 2",
      customer_district: "Dhaka",
      items: [],
      total_amount: 1000,
      payment_method: "bkash"
    });

    expect(result.success).toBe(false);
  });
});

