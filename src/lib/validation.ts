import { z } from "zod";

export const bangladeshPhoneRegex = /^\+880\d{9}$/;

const normalizedOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  options: z.record(z.string(), z.string()).default({}),
  variantId: z.string().optional()
});

const legacyOrderItemSchema = z
  .object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
    size: z.string().min(1),
    color: z.string().min(1)
  })
  .transform((v) => ({
    productId: v.productId,
    quantity: v.quantity,
    options: { Size: v.size, Color: v.color },
    variantId: undefined
  }));

export const orderItemSchema = z.union([normalizedOrderItemSchema, legacyOrderItemSchema]);

export const orderSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters"),
  customer_phone: z
    .string()
    .regex(bangladeshPhoneRegex, "Valid BD phone required (+880XXXXXXXXX)"),
  customer_email: z.string().email("Valid email required"),
  customer_address: z.string().min(5, "Address must be at least 5 characters"),
  customer_district: z.string().min(1, "Select a district"),
  special_instructions: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Cart must have at least one item"),
  total_amount: z.number().min(100, "Minimum order: ৳100"),
  payment_method: z.enum(["bkash", "nagad"])
});

export type Order = z.infer<typeof orderSchema>;
