import type { Order, OrderItem } from "@/types";

export function formatOrderWhatsAppMessage(order: Order, items: OrderItem[]) {
  const itemLines = items.map((item) => {
    const variant =
      item.size !== "Default" || item.color !== "Default" ? ` (${item.size} / ${item.color})` : "";
    return `- ${item.product_name}${variant} x${item.quantity} = ৳${item.subtotal}`;
  });

  const lines = [
    `Order ID: ${order.id}`,
    "",
    "Items:",
    ...itemLines,
    "",
    `Total: ৳${order.total_amount}`,
    `Payment: ${order.payment_method.toUpperCase()} (${order.payment_status})`,
    "",
    "Delivery:",
    `Name: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `District: ${order.customer_district}`,
    `Address: ${order.customer_address}`
  ];

  if (order.special_instructions) {
    lines.push("", `Special instructions: ${order.special_instructions}`);
  }

  return lines.join("\n");
}
