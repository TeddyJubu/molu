import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isNocoConfigured, NocoDBClient } from "@/lib/nocodb";
import { notifyOrderStatusChanged } from "@/lib/notifications/events";

export const dynamic = "force-dynamic";

const server = new McpServer({
  name: "molu-admin",
  version: "1.0.0"
});

const transport = new WebStandardStreamableHTTPServerTransport();
let connectedPromise: Promise<void> | null = null;

function ensureConnected() {
  if (!connectedPromise) {
    connectedPromise = server.connect(transport);
  }
  return connectedPromise;
}

server.registerTool(
  "list_products",
  {
    title: "List Products",
    description: "List products in the store",
    inputSchema: {
      page: z.number().optional(),
      pageSize: z.number().optional(),
      is_active: z.boolean().optional()
    }
  },
  async ({ page, pageSize, is_active }) => {
    if (!isNocoConfigured()) {
      return { isError: true, content: [{ type: "text", text: "NocoDB is not configured" }] };
    }
    const noco = new NocoDBClient();
    const products = await noco.listProducts({ page, pageSize, is_active });
    return { content: [{ type: "text", text: JSON.stringify(products, null, 2) }] };
  }
);

server.registerTool(
  "create_product",
  {
    title: "Create Product",
    description: "Create a new product",
    inputSchema: {
      name: z.string(),
      price: z.number(),
      description: z.string().optional(),
      brand: z.string().optional(),
      sizes: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional()
    }
  },
  async (args) => {
    if (!isNocoConfigured()) {
      return { isError: true, content: [{ type: "text", text: "NocoDB is not configured" }] };
    }
    const noco = new NocoDBClient();
    const product = await noco.createProduct({ ...args, is_active: true });
    return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
  }
);

server.registerTool(
  "delete_product",
  {
    title: "Delete Product",
    description: "Disable a product (soft delete)",
    inputSchema: { id: z.string() }
  },
  async ({ id }) => {
    if (!isNocoConfigured()) {
      return { isError: true, content: [{ type: "text", text: "NocoDB is not configured" }] };
    }
    const noco = new NocoDBClient();
    const product = await noco.deleteProduct(id);
    return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
  }
);

server.registerTool(
  "list_orders",
  {
    title: "List Orders",
    description: "List orders and filter by status",
    inputSchema: {
      page: z.number().optional(),
      pageSize: z.number().optional(),
      order_status: z.string().optional(),
      payment_status: z.string().optional()
    }
  },
  async (args) => {
    if (!isNocoConfigured()) {
      return { isError: true, content: [{ type: "text", text: "NocoDB is not configured" }] };
    }
    const noco = new NocoDBClient();
    const orders = await noco.listOrders(args);
    return { content: [{ type: "text", text: JSON.stringify(orders, null, 2) }] };
  }
);

server.registerTool(
  "update_order_status",
  {
    title: "Update Order Status",
    description: "Update order status and notify customer via WhatsApp",
    inputSchema: {
      id: z.string(),
      status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
    }
  },
  async ({ id, status }) => {
    if (!isNocoConfigured()) {
      return { isError: true, content: [{ type: "text", text: "NocoDB is not configured" }] };
    }
    const noco = new NocoDBClient();
    await noco.updateOrder(id, { order_status: status });
    const order = await noco.getOrder(id);
    await notifyOrderStatusChanged({ orderId: id, phone: order.customer_phone, status, customerName: order.customer_name });
    return { content: [{ type: "text", text: `Order ${id} status updated to ${status}` }] };
  }
);

async function handleMcpRequest(request: Request) {
  const requiredKey = process.env.MCP_API_KEY;
  if (requiredKey) {
    const provided = request.headers.get("x-mcp-api-key");
    if (provided !== requiredKey) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  await ensureConnected();
  return transport.handleRequest(request);
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}
