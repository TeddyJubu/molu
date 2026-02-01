"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildWhatsAppClickToChatUrl, parseWhatsAppRecipients } from "@/lib/whatsapp/click-to-chat";
import { normalizeWhatsAppTo } from "@/lib/whatsapp/normalize";

export function WhatsAppOrderWidget({ message }: { message: string }) {
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const chatUrl = useMemo(() => {
    if (!selectedRecipient) return null;
    return buildWhatsAppClickToChatUrl(selectedRecipient, message);
  }, [message, selectedRecipient]);

  useEffect(() => {
    if (!chatUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(chatUrl, { width: 240, margin: 1 })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(null));
  }, [chatUrl]);

  useEffect(() => {
    if (selectedRecipient) return;
    setSelectedRecipient(defaultRecipient);
  }, [defaultRecipient, selectedRecipient]);

  if (!recipients.length) return null;

  const selectedLabel = selectedRecipient ? `+${selectedRecipient}` : "WhatsApp number";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send this order on WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan the QR code (or tap the button) to open WhatsApp with your order details ready to send.
        </p>

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
              onClick={() => navigator.clipboard.writeText(message)}
            >
              Copy message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
