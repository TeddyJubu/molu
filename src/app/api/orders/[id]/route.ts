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
    const [order, items] = await Promise.all([nocodb.getOrder(id), nocodb.listOrderItems(id)]);
    return ok({ order, items });
  } catch (error) {
    return failFromError(error);
  }
}
