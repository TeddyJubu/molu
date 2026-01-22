import { initiateNagadPayment } from "@/lib/payments/nagad";

describe("initiateNagadPayment", () => {
  it("returns a mock payment session URL", () => {
    const session = initiateNagadPayment({ origin: "http://example.test", orderId: "ORD-1", amount: 1000 });
    expect(session.gateway).toBe("nagad");
    expect(session.paymentId).toMatch(/^NAGAD-/);
    expect(session.paymentUrl).toContain("http://example.test/pay/mock");
    expect(session.paymentUrl).toContain("orderId=ORD-1");
  });
});

