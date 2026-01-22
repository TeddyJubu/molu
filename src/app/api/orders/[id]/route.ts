import { NextResponse } from "next/server";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";

export async function GET(_request: Request, context: any) {
  if (!isNocoConfigured()) {
    return NextResponse.json(
      { error: "NocoDB is not configured. Set NOCODB_API_URL, NOCODB_API_TOKEN, NOCODB_PROJECT_ID." },
      { status: 503 }
    );
  }

  try {
    const params = await Promise.resolve(context.params);
    const id = params?.id as string;
    const nocodb = new NocoDBClient();
    const [order, items] = await Promise.all([nocodb.getOrder(id), nocodb.listOrderItems(id)]);
    return NextResponse.json({ order, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

