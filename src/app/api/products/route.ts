import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { parseProductsQuery } from "@/lib/productsQuery";
import { ConfigError } from "@/lib/api/errors";
import { failFromError, ok } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    if (!isNocoConfigured()) {
      throw new ConfigError("NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID.");
    }
    const query = parseProductsQuery(new URL(request.url));
    const nocodb = new NocoDBClient();
    const items = await nocodb.listProducts(query);
    return ok({ items, pageInfo: { page: query.page, pageSize: query.pageSize } });
  } catch (error) {
    return failFromError(error);
  }
}
