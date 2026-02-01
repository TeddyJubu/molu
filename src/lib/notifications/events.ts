import { sendLoopsTransactionalEmail } from "@/lib/notifications/loops";
import { normalizeWhatsAppTo, sendWhatsAppTemplateMessage } from "@/lib/notifications/whatsapp";
import { parseWhatsAppRecipients } from "@/lib/whatsapp/click-to-chat";

function templateId(name: string) {
  const value = process.env[name];
  if (!value) return null;
  return value;
}

export async function notifyOrderCreated(params: {
  origin: string;
  orderId: string;
  email: string;
  phone: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
}) {
  const transactionalId = templateId("LOOPS_TX_ORDER_CREATED_ID");
  if (transactionalId) {
    try {
      await sendLoopsTransactionalEmail({
        email: params.email,
        transactionalId,
        idempotencyKey: `order_created:${params.orderId}`,
        dataVariables: {
          orderId: params.orderId,
          orderUrl: `${params.origin}/order/${params.orderId}`,
          customerName: params.customerName,
          totalAmount: params.totalAmount,
          paymentMethod: params.paymentMethod
        }
      });
    } catch {}
  }

  const waTemplate = templateId("WHATSAPP_TEMPLATE_ORDER_CREATED");
  const waTo = normalizeWhatsAppTo(params.phone);
  if (waTemplate && waTo) {
    try {
      await sendWhatsAppTemplateMessage({
        to: waTo,
        templateName: waTemplate,
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: params.customerName }, { type: "text", text: params.orderId }]
          }
        ]
      });
    } catch {}
  }

  const adminToRaw = process.env.WHATSAPP_ADMIN_TO;
  const adminTos = parseWhatsAppRecipients(adminToRaw);
  if (waTemplate && adminTos.length) {
    await Promise.allSettled(
      adminTos.map((to) =>
        sendWhatsAppTemplateMessage({
          to,
          templateName: waTemplate,
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: params.customerName }, { type: "text", text: params.orderId }]
            }
          ]
        })
      )
    );
  }
}

export async function notifyPaymentCompleted(params: {
  origin: string;
  orderId: string;
  email: string;
  phone: string;
  totalAmount: number;
  paymentMethod: string;
  paymentId: string;
}) {
  const transactionalId = templateId("LOOPS_TX_PAYMENT_COMPLETED_ID");
  if (transactionalId) {
    try {
      await sendLoopsTransactionalEmail({
        email: params.email,
        transactionalId,
        idempotencyKey: `payment_completed:${params.orderId}:${params.paymentId}`,
        dataVariables: {
          orderId: params.orderId,
          orderUrl: `${params.origin}/order/${params.orderId}`,
          totalAmount: params.totalAmount,
          paymentMethod: params.paymentMethod,
          paymentId: params.paymentId
        }
      });
    } catch {}
  }

  const waTemplate = templateId("WHATSAPP_TEMPLATE_PAYMENT_COMPLETED");
  const waTo = normalizeWhatsAppTo(params.phone);
  if (waTemplate && waTo) {
    try {
      await sendWhatsAppTemplateMessage({
        to: waTo,
        templateName: waTemplate,
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: String(params.totalAmount) }, { type: "text", text: params.orderId }]
          }
        ]
      });
    } catch {}
  }

  const adminTos = parseWhatsAppRecipients(process.env.WHATSAPP_ADMIN_TO);
  if (waTemplate && adminTos.length) {
    await Promise.allSettled(
      adminTos.map((to) =>
        sendWhatsAppTemplateMessage({
          to,
          templateName: waTemplate,
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: String(params.totalAmount) }, { type: "text", text: params.orderId }]
            }
          ]
        })
      )
    );
  }
}

export async function notifyPaymentFailed(params: {
  origin: string;
  orderId: string;
  email: string;
  phone: string;
  customerName?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentId: string;
}) {
  const transactionalId = templateId("LOOPS_TX_PAYMENT_FAILED_ID");
  if (transactionalId) {
    try {
      await sendLoopsTransactionalEmail({
        email: params.email,
        transactionalId,
        idempotencyKey: `payment_failed:${params.orderId}:${params.paymentId}`,
        dataVariables: {
          orderId: params.orderId,
          orderUrl: `${params.origin}/order/${params.orderId}`,
          totalAmount: params.totalAmount,
          paymentMethod: params.paymentMethod,
          paymentId: params.paymentId
        }
      });
    } catch {}
  }

  const waTemplate = templateId("WHATSAPP_TEMPLATE_PAYMENT_FAILED");
  const waTo = normalizeWhatsAppTo(params.phone);
  if (waTemplate && waTo) {
    try {
      const safeName = params.customerName?.trim() || "Customer";
      await sendWhatsAppTemplateMessage({
        to: waTo,
        templateName: waTemplate,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: safeName },
              { type: "text", text: String(params.totalAmount) },
              { type: "text", text: params.orderId }
            ]
          }
        ]
      });
    } catch {}
  }

  const adminTos = parseWhatsAppRecipients(process.env.WHATSAPP_ADMIN_TO);
  if (waTemplate && adminTos.length) {
    const safeName = params.customerName?.trim() || "Customer";
    await Promise.allSettled(
      adminTos.map((to) =>
        sendWhatsAppTemplateMessage({
          to,
          templateName: waTemplate,
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: safeName },
                { type: "text", text: String(params.totalAmount) },
                { type: "text", text: params.orderId }
              ]
            }
          ]
        })
      )
    );
  }
}

function estimatedDeliveryDateText(now = new Date()) {
  const eta = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  return eta.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export async function notifyOrderStatusChanged(params: { orderId: string; phone: string; status: string; customerName?: string }) {
  const normalizedStatus = params.status.trim().toLowerCase();
  const templateEnvName =
    normalizedStatus === "confirmed"
      ? "WHATSAPP_TEMPLATE_ORDER_CONFIRMED"
      : normalizedStatus === "shipped"
        ? "WHATSAPP_TEMPLATE_ORDER_SHIPPED"
        : normalizedStatus === "delivered"
          ? "WHATSAPP_TEMPLATE_ORDER_DELIVERED"
          : null;

  if (!templateEnvName) return;

  const waTemplate = templateId(templateEnvName);
  const waTo = normalizeWhatsAppTo(params.phone);

  if (!waTemplate || !waTo) return;

  try {
    const safeName = params.customerName?.trim() || "Customer";
    const parameters =
      normalizedStatus === "confirmed"
        ? [
            { type: "text", text: safeName },
            { type: "text", text: params.orderId },
            { type: "text", text: estimatedDeliveryDateText() }
          ]
        : [
            { type: "text", text: safeName },
            { type: "text", text: params.orderId }
          ];
    await sendWhatsAppTemplateMessage({
      to: waTo,
      templateName: waTemplate,
      components: [
        {
          type: "body",
          parameters
        }
      ]
    });
  } catch {}
}
