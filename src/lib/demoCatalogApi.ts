import type { InventoryItem, Product, ProductImage, ProductOption, ProductSummary, ProductVariant } from "@/types";
import { products as demoProducts, productImageSets } from "@/lib/demo-data";

function normalizeId(value: unknown) {
  return String(value ?? "").trim();
}

function buildOptionsFromDemo(productId: string, sizes: string[], colors: string[]): ProductOption[] {
  return [
    { id: `${productId}-opt-age-range`, product_id: productId, name: "Age Range", values: sizes ?? [], position: 0 },
    { id: `${productId}-opt-color`, product_id: productId, name: "Color", values: colors ?? [], position: 1 }
  ];
}

function buildVariantsFromDemo(productId: string, sizes: string[], colors: string[]): ProductVariant[] {
  const out: ProductVariant[] = [];
  for (const size of sizes ?? []) {
    for (const color of colors ?? []) {
      out.push({
        id: `${productId}-var-${encodeURIComponent(size)}-${encodeURIComponent(color)}`,
        product_id: productId,
        options: { "Age Range": size, Color: color },
        stock_qty: 20,
        price: null
      });
    }
  }
  if (!out.length) {
    out.push({
      id: `${productId}-var-default`,
      product_id: productId,
      options: { "Age Range": "Default", Color: "Default" },
      stock_qty: 20,
      price: null
    });
  }
  return out;
}

function buildInventoryFromVariants(productId: string, variants: ProductVariant[]): InventoryItem[] {
  return variants.map((v) => ({
    id: `${v.id}-inv`,
    product_id: productId,
    size: v.options["Age Range"] ?? "Default",
    color: v.options["Color"] ?? "Default",
    stock_qty: v.stock_qty,
    low_stock_threshold: null
  }));
}

function buildImagesFromDemo(productId: string, fallbackUrl: string): ProductImage[] {
  const images = (productImageSets[productId] ?? []).map((img, idx) => ({
    id: `${productId}-img-${idx}`,
    product_id: productId,
    image_url: img.url,
    display_order: idx,
    is_primary: idx === 0
  }));
  if (images.length) return images;
  return [
    {
      id: `${productId}-img-0`,
      product_id: productId,
      image_url: fallbackUrl,
      display_order: 0,
      is_primary: true
    }
  ];
}

export function demoListProducts(params: { page: number; pageSize: number; is_active?: boolean }) {
  const itemsAll: ProductSummary[] = demoProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    sizes: p.sizes,
    colors: p.colors,
    image: p.image
  }));

  const limit = params.pageSize ?? 20;
  const page = params.page ?? 1;
  const offset = Math.max(0, (page - 1) * limit);
  const items = itemsAll.slice(offset, offset + limit);
  return { items, pageInfo: { page, pageSize: limit } };
}

export function demoGetProductDetail(id: unknown) {
  const productId = normalizeId(id);
  const demo = demoProducts.find((p) => p.id === productId) ?? null;
  if (!demo) return null;

  const product: Product = {
    id: demo.id,
    name: demo.name,
    description: demo.description,
    price: demo.price,
    original_price: null,
    brand: null,
    sizes: demo.sizes,
    colors: demo.colors,
    is_active: true,
    stock_status: null
  };

  const images = buildImagesFromDemo(productId, demo.image);
  const variants = buildVariantsFromDemo(productId, demo.sizes, demo.colors);
  const options = buildOptionsFromDemo(productId, demo.sizes, demo.colors);
  const inventory = buildInventoryFromVariants(productId, variants);

  return { product, images, inventory, options, variants, variantSource: "product_variants" as const };
}

