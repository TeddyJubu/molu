import { afterEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/api/errors";
import { normalizeWhatsAppTo, sendWhatsAppTemplateMessage } from "@/lib/notifications/whatsapp";

describe("whatsapp notifications", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("normalizes phone numbers to digits", () => {
    expect(normalizeWhatsAppTo("+8801-234 567 890")).toBe("8801234567890");
    expect(normalizeWhatsAppTo("01712 345 678")).toBe("8801712345678");
  });

  it("does nothing when disabled", async () => {
    process.env = { ...originalEnv, WHATSAPP_ENABLED: "false" };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendWhatsAppTemplateMessage({ to: "880123", templateName: "t" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls WhatsApp Cloud API when enabled and configured", async () => {
    process.env = { ...originalEnv, WHATSAPP_ENABLED: "true", WHATSAPP_ACCESS_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "p" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await sendWhatsAppTemplateMessage({ to: "880123", templateName: "order_created" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.facebook.com/v19.0/p/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer t",
          "content-type": "application/json"
        })
      })
    );
  });

  it("throws UpstreamError on failures", async () => {
    process.env = { ...originalEnv, WHATSAPP_ENABLED: "true", WHATSAPP_ACCESS_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "p" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(sendWhatsAppTemplateMessage({ to: "880123", templateName: "order_created" })).rejects.toBeInstanceOf(UpstreamError);
  });
});
