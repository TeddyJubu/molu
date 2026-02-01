import { normalizeWhatsAppTo } from "@/lib/whatsapp/normalize";

export function parseWhatsAppRecipients(input: string | undefined) {
  const normalized = (input ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => normalizeWhatsAppTo(v))
    .filter((v): v is string => Boolean(v));

  return Array.from(new Set(normalized));
}

export function buildWhatsAppClickToChatUrl(to: string, text: string) {
  const normalizedTo = normalizeWhatsAppTo(to) ?? to.replace(/\D/g, "");
  const url = new URL(`https://wa.me/${normalizedTo}`);
  url.searchParams.set("text", text);
  return url.toString();
}
