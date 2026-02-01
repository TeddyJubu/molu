export function normalizeWhatsAppTo(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("01")) digits = `880${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("1")) digits = `880${digits}`;
  return digits;
}
