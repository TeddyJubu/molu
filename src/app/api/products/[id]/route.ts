import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { ConfigError } from "@/lib/api/errors";
import { failFromError, ok } from "@/lib/api/response";

export async function GET(_request: Request, context: any) {
  try {
    if (!isNocoConfigured()) {
      throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
    }
    const params = await Promise.resolve(context.params);
    const id = params?.id as string;
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
