import { initiateBkashPayment } from "@/lib/payments/bkash";

describe("initiateBkashPayment", () => {
  it("returns a mock payment session URL", () => {
    const session = initiateBkashPayment({ origin: "http://example.test", orderId: "ORD-1", amount: 1000 });
    expect(session.gateway).toBe("bkash");
    expect(session.paymentId).toMatch(/^BKASH-/);
    expect(session.paymentUrl).toContain("http://example.test/pay/mock");
    expect(session.paymentUrl).toContain("orderId=ORD-1");
  });
});

