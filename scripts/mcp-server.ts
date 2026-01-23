import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { NocoDBClient } from "../src/lib/nocodb";
import { notifyOrderStatusChanged } from "../src/lib/notifications/events";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const server = new McpServer({
  name: "Molu Admin MCP",
  version: "1.0.0"
});

const noco = new NocoDBClient();

server.tool(
  "list_products",
  {
    page: z.number().optional(),
    pageSize: z.number().optional(),
    is_active: z.boolean().optional()
  },
  async ({ page, pageSize, is_active }) => {
    try {
      const products = await noco.listProducts({ page, pageSize, is_active });
      return {
        content: [{ type: "text", text: JSON.stringify(products, null, 2) }]
      };
    } catch (error: any) {
      return { isError: true, content: [{ type: "text", text: error.message }] };
    }
  }
);

server.tool(
  "create_product",
  {
    name: z.string(),
    price: z.number(),
    description: z.string().optional(),
    brand: z.string().optional(),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional()
  },
  async (args) => {
    try {
      const product = await noco.createProduct(args);
      return {
        content: [{ type: "text", text: `Product created: ${product.id} - ${product.name}` }]
      };
    } catch (error: any) {
      return { isError: true, content: [{ type: "text", text: error.message }] };
    }
  }
);

server.tool(
  "delete_product",
  { id: z.string() },
  async ({ id }) => {
    try {
      await noco.deleteProduct(id);
      return {
        content: [{ type: "text", text: `Product ${id} marked as inactive.` }]
      };
    } catch (error: any) {
      return { isError: true, content: [{ type: "text", text: error.message }] };
    }
  }
);

server.tool(
  "list_orders",
  {
    page: z.number().optional(),
    pageSize: z.number().optional(),
    order_status: z.string().optional(),
    payment_status: z.string().optional()
  },
  async (args) => {
    try {
      const orders = await noco.listOrders(args);
      return {
        content: [{ type: "text", text: JSON.stringify(orders, null, 2) }]
      };
    } catch (error: any) {
      return { isError: true, content: [{ type: "text", text: error.message }] };
    }
  }
);

server.tool(
  "update_order_status",
  {
    id: z.string(),
    status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
  },
  async ({ id, status }) => {
    try {
      await noco.updateOrder(id, { order_status: status });
      try {
        const order = await noco.getOrder(id);
        await notifyOrderStatusChanged({ orderId: id, phone: order.customer_phone, status });
      } catch {}
      return {
        content: [{ type: "text", text: `Order ${id} status updated to ${status}` }]
      };
    } catch (error: any) {
      return { isError: true, content: [{ type: "text", text: error.message }] };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Molu Admin MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
