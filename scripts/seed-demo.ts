import path from "node:path";
import dotenv from "dotenv";
import { NocoDBClient } from "../src/lib/nocodb";
import { products as demoProducts, productImageSets } from "../src/lib/demo-data";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

async function listAllProducts(nocodb: NocoDBClient) {
  const out: Array<{ id: string; name: string }> = [];
  for (let page = 1; page <= 25; page++) {
    const batch = await nocodb.listProductsAdmin({ page, pageSize: 100 });
    out.push(...batch.map((p) => ({ id: p.id, name: p.name })));
    if (batch.length < 100) break;
  }
  return out;
}

function buildVariants(sizes: string[], colors: string[]) {
  const variants: Array<{ options: Record<string, string>; stock_qty: number; price?: number | null }> = [];
  for (const size of sizes) {
    for (const color of colors) {
      variants.push({
        options: { "Age Range": size, Color: color },
        stock_qty: 20
      });
    }
  }
  if (!variants.length) {
    variants.push({ options: { "Age Range": "Default", Color: "Default" }, stock_qty: 20 });
  }
  return variants;
}

async function main() {
  const nocodb = new NocoDBClient();
  const existing = await listAllProducts(nocodb);

  for (const demo of demoProducts) {
    const match = existing.find((p) => normalizeName(p.name) === normalizeName(demo.name)) ?? null;
    const product = match
      ? await nocodb.updateProduct(match.id, {
          name: demo.name,
          description: demo.description,
          price: demo.price,
          is_active: true
        })
      : await nocodb.createProduct({
          name: demo.name,
          description: demo.description,
          price: demo.price,
          is_active: true
        });

    if (!match) existing.push({ id: product.id, name: product.name });

    await nocodb.replaceProductOptions(product.id, [
      { name: "Age Range", values: demo.sizes, position: 0 },
      { name: "Color", values: demo.colors, position: 1 }
    ]);

    await nocodb.replaceProductVariants(product.id, buildVariants(demo.sizes, demo.colors));

    const images = productImageSets[demo.id] ?? [{ url: demo.image, alt: demo.name }];
    await nocodb.replaceProductImages(
      product.id,
      images.map((img, idx) => ({
        image_url: img.url,
        display_order: idx,
        is_primary: idx === 0,
        alt_text: img.alt
      }))
    );
  }

  process.stdout.write(`seeded_products=${demoProducts.length}\n`);
}

main().catch((error) => {
  console.error(String((error as any)?.stack || error));
  process.exit(1);
});

