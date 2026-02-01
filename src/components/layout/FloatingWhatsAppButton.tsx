"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildWhatsAppClickToChatUrl, parseWhatsAppRecipients } from "@/lib/whatsapp/click-to-chat";
import { normalizeWhatsAppTo } from "@/lib/whatsapp/normalize";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const recipients = useMemo(
    () => parseWhatsAppRecipients(process.env.NEXT_PUBLIC_WHATSAPP_ORDER_RECIPIENTS),
    []
  );

  const defaultRecipient = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_RECIPIENT;
    const normalized = raw ? normalizeWhatsAppTo(raw) : null;
    return normalized ?? recipients[0] ?? null;
  }, [recipients]);

  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(defaultRecipient);
  const [message, setMessage] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const chatUrl = useMemo(() => {
    if (!selectedRecipient) return null;
    if (!message) return null;
    return buildWhatsAppClickToChatUrl(selectedRecipient, message);
  }, [message, selectedRecipient]);

  useEffect(() => {
    if (selectedRecipient) return;
    setSelectedRecipient(defaultRecipient);
  }, [defaultRecipient, selectedRecipient]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    setMessage(`Hi! I want to order from Molu Kids. Page: ${url}`);
  }, [pathname]);

  useEffect(() => {
    if (!chatUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(chatUrl, { width: 240, margin: 1 })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(null));
  }, [chatUrl]);

  if (!recipients.length) return null;
  if (pathname.startsWith("/admin")) return null;

  const selectedLabel = selectedRecipient ? `+${selectedRecipient}` : "WhatsApp number";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full p-0 shadow-lg"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chat on WhatsApp</DialogTitle>
          <DialogDescription>Scan the QR code (or tap the button) to message us on WhatsApp.</DialogDescription>
        </DialogHeader>

        {recipients.length > 1 ? (
          <div className="max-w-xs">
            <Select value={selectedRecipient ?? ""} onValueChange={(v) => setSelectedRecipient(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select WhatsApp number">{selectedLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {recipients.map((to) => (
                  <SelectItem key={to} value={to}>
                    +{to}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-[240px] overflow-hidden rounded-md border bg-white p-2">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="WhatsApp QR code" className="h-auto w-full" />
            ) : (
              <div className="flex h-[224px] w-full items-center justify-center text-sm text-muted-foreground">
                QR code unavailable
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild disabled={!chatUrl}>
              <a href={chatUrl ?? "#"} target="_blank" rel="noreferrer">
                Open WhatsApp
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!message}
              onClick={() =>
                navigator.clipboard
                  .writeText(message)
                  .then(() => toast.success("Message copied"))
                  .catch(() => toast.error("Failed to copy"))
              }
            >
              Copy message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
