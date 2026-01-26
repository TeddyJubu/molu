import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { failFromError, ok } from "@/lib/api/response";
import { demoGetProductDetail } from "@/lib/demoCatalogApi";

export async function GET(_request: Request, context: any) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params?.id as string;
    if (!isNocoConfigured()) {
      const demo = demoGetProductDetail(id);
      if (!demo) return ok({ product: null, images: [], inventory: [], options: [], variants: [], variantSource: "none" });
      return ok(demo);
    }

    const nocodb = new NocoDBClient();
    const [product, images, inventory, config] = await Promise.all([
      nocodb.getProductById(id),
      nocodb.listProductImages(id),
      nocodb.listInventory(id),
      nocodb.getProductVariantConfiguration(id)
    ]);

    return ok({ product, images, inventory, options: config.options, variants: config.variants, variantSource: config.source });
  } catch (error) {
    return failFromError(error);
  }
}
