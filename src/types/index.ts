export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  brand?: string | null;
  sizes: string[];
  colors: string[];
  is_active?: boolean;
  stock_status?: string | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order?: number | null;
  is_primary?: boolean | null;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock_qty: number;
  low_stock_threshold?: number | null;
}

export type VariantOptions = Record<string, string>;

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  values: string[];
  position?: number | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  options: VariantOptions;
  stock_qty: number;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  age_range: string;
  color: string;
  stock_qty: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  sizes: string[];
  colors: string[];
  image?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  size: string;
  color: string;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_district: string;
  special_instructions?: string | null;
  total_amount: number;
  payment_method: "bkash" | "nagad";
  payment_status: "pending" | "completed" | "failed";
  payment_id?: string | null;
  order_status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at?: string;
  updated_at?: string;
}
