import { notifyOrderCreated, notifyPaymentCompleted } from "@/lib/notifications/events";

vi.mock("@/lib/notifications/loops", () => ({
  sendLoopsTransactionalEmail: vi.fn()
}));

vi.mock("@/lib/notifications/whatsapp", () => ({
  normalizeWhatsAppTo: (phone: string) => phone.replace(/\D/g, ""),
  sendWhatsAppTemplateMessage: vi.fn()
}));

describe("notification events", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("sends email + WhatsApp on order created when configured", async () => {
    process.env = {
      ...originalEnv,
      LOOPS_TX_ORDER_CREATED_ID: "tx_order_created",
      WHATSAPP_TEMPLATE_ORDER_CREATED: "wa_order_created",
      WHATSAPP_ADMIN_TO: "+8801230000000"
    };

    const { sendLoopsTransactionalEmail } = await import("@/lib/notifications/loops");
    const { sendWhatsAppTemplateMessage } = await import("@/lib/notifications/whatsapp");

    await notifyOrderCreated({
      origin: "http://example.test",
      orderId: "ORD-1",
      email: "a@b.com",
      phone: "+880123456789",
      customerName: "A",
      totalAmount: 1000,
      paymentMethod: "bkash"
    });

    expect(sendLoopsTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(sendWhatsAppTemplateMessage).toHaveBeenCalledTimes(2);
  });

  it("does nothing when templates are not configured", async () => {
    process.env = { ...originalEnv };

    const { sendLoopsTransactionalEmail } = await import("@/lib/notifications/loops");
    const { sendWhatsAppTemplateMessage } = await import("@/lib/notifications/whatsapp");

    await notifyOrderCreated({
      origin: "http://example.test",
      orderId: "ORD-1",
      email: "a@b.com",
      phone: "+880123456789",
      customerName: "A",
      totalAmount: 1000,
      paymentMethod: "bkash"
    });

    expect(sendLoopsTransactionalEmail).not.toHaveBeenCalled();
    expect(sendWhatsAppTemplateMessage).not.toHaveBeenCalled();
  });

  it("can send WhatsApp payment completed without Loops template", async () => {
    process.env = { ...originalEnv, WHATSAPP_TEMPLATE_PAYMENT_COMPLETED: "wa_payment_completed" };

    const { sendWhatsAppTemplateMessage } = await import("@/lib/notifications/whatsapp");

    await notifyPaymentCompleted({
      origin: "http://example.test",
      orderId: "ORD-1",
      email: "a@b.com",
      phone: "+880123456789",
      totalAmount: 1000,
      paymentMethod: "bkash",
      paymentId: "P"
    });

    expect(sendWhatsAppTemplateMessage).toHaveBeenCalledTimes(1);
  });
});
