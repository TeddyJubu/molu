import { describe, expect, it } from "vitest";
import { buildWhatsAppClickToChatUrl, parseWhatsAppRecipients } from "@/lib/whatsapp/click-to-chat";
import { formatOrderWhatsAppMessage } from "@/lib/whatsapp/order-message";
import type { Order, OrderItem } from "@/types";

describe("whatsapp order flow helpers", () => {
  it("parses and normalizes a comma-separated recipients list", () => {
    const result = parseWhatsAppRecipients("+8801712345678, 01712 345 678, , not-a-phone, 8801712345678");
    expect(result).toEqual(["8801712345678"]);
  });

  it("builds a wa.me click-to-chat URL with encoded text", () => {
    const url = buildWhatsAppClickToChatUrl("+8801712345678", "Hello world");
    expect(url).toBe("https://wa.me/8801712345678?text=Hello+world");
  });

  it("formats an order message with items and delivery details", () => {
    const order: Order = {
      id: "ORD_123",
      customer_name: "Amina",
      customer_phone: "+8801712345678",
      customer_email: "amina@example.com",
      customer_address: "House 1\nRoad 2",
      customer_district: "Dhaka",
      special_instructions: "Call before delivery",
      total_amount: 550,
      payment_method: "bkash",
      payment_status: "pending",
      payment_id: null,
      order_status: "pending"
    };

    const items: OrderItem[] = [
      {
        id: "i1",
        order_id: "ORD_123",
        product_id: "p1",
        product_name: "T-Shirt",
        product_price: 250,
        size: "M",
        color: "Blue",
        quantity: 2,
        subtotal: 500
      },
      {
        id: "i2",
        order_id: "ORD_123",
        product_id: "p2",
        product_name: "Socks",
        product_price: 50,
        size: "Default",
        color: "Default",
        quantity: 1,
        subtotal: 50
      }
    ];

    const message = formatOrderWhatsAppMessage(order, items);

    expect(message).toContain("Order ID: ORD_123");
    expect(message).toContain("- T-Shirt (M / Blue) x2 = ৳500");
    expect(message).toContain("- Socks x1 = ৳50");
    expect(message).toContain("Total: ৳550");
    expect(message).toContain("District: Dhaka");
    expect(message).toContain("Special instructions: Call before delivery");
  });
});
