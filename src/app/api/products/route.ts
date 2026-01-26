import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { parseProductsQuery } from "@/lib/productsQuery";
import { failFromError, ok } from "@/lib/api/response";
import { demoListProducts } from "@/lib/demoCatalogApi";

export async function GET(request: Request) {
  try {
    const query = parseProductsQuery(new URL(request.url));
    if (!isNocoConfigured()) {
      return ok(demoListProducts(query));
    }
    const nocodb = new NocoDBClient();
    const items = await nocodb.listProducts(query);
    if (!items.length) {
      return ok(demoListProducts(query));
    }
    return ok({ items, pageInfo: { page: query.page, pageSize: query.pageSize } });
  } catch (error) {
    return failFromError(error);
  }
}
