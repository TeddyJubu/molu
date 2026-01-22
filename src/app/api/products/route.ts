import { NextResponse } from "next/server";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { parseProductsQuery } from "@/lib/productsQuery";

export async function GET(request: Request) {
  if (!isNocoConfigured()) {
    return NextResponse.json(
      { error: "NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID." },
      { status: 503 }
    );
  }

  try {
    const query = parseProductsQuery(new URL(request.url));
    const nocodb = new NocoDBClient();
    const items = await nocodb.listProducts(query);
    return NextResponse.json({ items, pageInfo: { page: query.page, pageSize: query.pageSize } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
