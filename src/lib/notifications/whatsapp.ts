import { UpstreamError } from "@/lib/api/errors";

export type WhatsAppTemplateMessage = {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: unknown[];
};

export function isWhatsAppEnabled() {
  return process.env.WHATSAPP_ENABLED === "true";
}

export function normalizeWhatsAppTo(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits;
}

export async function sendWhatsAppTemplateMessage(message: WhatsAppTemplateMessage) {
  if (!isWhatsAppEnabled()) return;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: message.to,
      type: "template",
      template: {
        name: message.templateName,
        language: { code: message.languageCode ?? process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US" },
        ...(message.components ? { components: message.components } : {})
      }
    })
  });

  if (!res.ok) {
    throw new UpstreamError({ service: "whatsapp", status: res.status });
  }
}
