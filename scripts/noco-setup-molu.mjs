import fs from "node:fs";

function readEnvFile(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2];
  }
  return env;
}

const env = { ...readEnvFile(".env.local"), ...process.env };
const baseUrl = (env.NOCODB_API_URL || "http://localhost:8080").replace(/\/+$/, "");
const token = env.NOCODB_API_TOKEN;
const projectId = env.NOCODB_PROJECT_ID;
const allowDestructiveSetup = env.NOCODB_ALLOW_DESTRUCTIVE_SETUP === "true";
const isLocal = (() => {
  try {
    const url = new URL(baseUrl);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
})();

if (!token || !projectId) {
  throw new Error("Missing NOCODB_API_TOKEN or NOCODB_PROJECT_ID in .env.local");
}
if (!allowDestructiveSetup) {
  throw new Error("Refusing to run destructive NocoDB setup. Set NOCODB_ALLOW_DESTRUCTIVE_SETUP=true to proceed.");
}
if (!isLocal) {
  throw new Error(`Refusing to run destructive NocoDB setup against non-local server: ${baseUrl}`);
}

async function request(path, init) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(token ? { "xc-auth": token, "xc-token": token } : {}),
      ...(init?.headers ?? {})
    }
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    throw new Error(`${init?.method || "GET"} ${path} -> ${res.status}: ${text}`);
  }
  return { res, text, json };
}

async function ensureFreshTable({ title, table_name, columns, source_id }) {
  const tables = (await request(`/api/v1/db/meta/projects/${projectId}/tables`)).json?.list ?? [];
  const existing = tables.find((t) => t?.title === title);
  if (existing?.id) {
    await request(`/api/v1/db/meta/tables/${existing.id}`, { method: "DELETE" });
  }

  const created = await request(`/api/v2/meta/bases/${projectId}/tables`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, table_name, type: "table", source_id, columns })
  });
  return created.json?.id ?? null;
}

async function main() {
  await request("/api/v1/health");

  const tablesResp = await request(`/api/v1/db/meta/projects/${projectId}/tables`);
  const tables = tablesResp.json?.list ?? [];
  const sourceId = tables[0]?.source_id;
  if (!sourceId) throw new Error("Could not determine source_id");

  await ensureFreshTable({
    title: "products",
    table_name: "products",
    source_id: sourceId,
    columns: [
      { title: "id", column_name: "id", uidt: "ID" },
      { title: "name", column_name: "name", uidt: "SingleLineText" },
      { title: "description", column_name: "description", uidt: "LongText" },
      { title: "price", column_name: "price", uidt: "Number" },
      { title: "original_price", column_name: "original_price", uidt: "Number" },
      { title: "brand", column_name: "brand", uidt: "SingleLineText" },
      { title: "sizes", column_name: "sizes", uidt: "SingleLineText" },
      { title: "colors", column_name: "colors", uidt: "SingleLineText" },
      { title: "is_active", column_name: "is_active", uidt: "Checkbox" },
      { title: "stock_status", column_name: "stock_status", uidt: "SingleLineText" }
    ]
  });

  await ensureFreshTable({
    title: "product_images",
    table_name: "product_images",
    source_id: sourceId,
    columns: [
      { title: "id", column_name: "id", uidt: "ID" },
      { title: "product_id", column_name: "product_id", uidt: "Number" },
      { title: "image_url", column_name: "image_url", uidt: "SingleLineText" },
      { title: "display_order", column_name: "display_order", uidt: "Number" },
      { title: "is_primary", column_name: "is_primary", uidt: "Checkbox" }
    ]
  });

  await ensureFreshTable({
    title: "product_inventory",
    table_name: "product_inventory",
    source_id: sourceId,
    columns: [
      { title: "id", column_name: "id", uidt: "ID" },
      { title: "product_id", column_name: "product_id", uidt: "Number" },
      { title: "size", column_name: "size", uidt: "SingleLineText" },
      { title: "color", column_name: "color", uidt: "SingleLineText" },
      { title: "stock_qty", column_name: "stock_qty", uidt: "Number" },
      { title: "low_stock_threshold", column_name: "low_stock_threshold", uidt: "Number" }
    ]
  });

  await ensureFreshTable({
    title: "orders",
    table_name: "orders",
    source_id: sourceId,
    columns: [
      { title: "row_id", column_name: "row_id", uidt: "ID" },
      { title: "id", column_name: "id", uidt: "SingleLineText" },
      { title: "customer_name", column_name: "customer_name", uidt: "SingleLineText" },
      { title: "customer_phone", column_name: "customer_phone", uidt: "SingleLineText" },
      { title: "customer_email", column_name: "customer_email", uidt: "SingleLineText" },
      { title: "customer_address", column_name: "customer_address", uidt: "LongText" },
      { title: "customer_district", column_name: "customer_district", uidt: "SingleLineText" },
      { title: "special_instructions", column_name: "special_instructions", uidt: "LongText" },
      { title: "total_amount", column_name: "total_amount", uidt: "Number" },
      { title: "payment_method", column_name: "payment_method", uidt: "SingleLineText" },
      { title: "payment_status", column_name: "payment_status", uidt: "SingleLineText" },
      { title: "payment_id", column_name: "payment_id", uidt: "SingleLineText" },
      { title: "order_status", column_name: "order_status", uidt: "SingleLineText" }
    ]
  });

  await ensureFreshTable({
    title: "order_items",
    table_name: "order_items",
    source_id: sourceId,
    columns: [
      { title: "row_id", column_name: "row_id", uidt: "ID" },
      { title: "order_id", column_name: "order_id", uidt: "SingleLineText" },
      { title: "product_id", column_name: "product_id", uidt: "Number" },
      { title: "product_name", column_name: "product_name", uidt: "SingleLineText" },
      { title: "product_price", column_name: "product_price", uidt: "Number" },
      { title: "size", column_name: "size", uidt: "SingleLineText" },
      { title: "color", column_name: "color", uidt: "SingleLineText" },
      { title: "quantity", column_name: "quantity", uidt: "Number" },
      { title: "subtotal", column_name: "subtotal", uidt: "Number" }
    ]
  });

  const demoProducts = [
    {
      name: "Onesie",
      description: "Soft cotton onesie",
      price: 500,
      original_price: null,
      brand: "Molu",
      sizes: "6M,12M,18M",
      colors: "White,Blue",
      is_active: 1,
      stock_status: "in_stock"
    },
    {
      name: "T-Shirt",
      description: "Comfy everyday tee",
      price: 250,
      original_price: 300,
      brand: "Molu",
      sizes: "2Y,3Y,4Y",
      colors: "Red,Blue",
      is_active: 1,
      stock_status: "in_stock"
    },
    {
      name: "Hoodie",
      description: "Warm hoodie for cooler days",
      price: 750,
      original_price: null,
      brand: "Molu",
      sizes: "3Y,4Y,5Y",
      colors: "Gray,Navy",
      is_active: 1,
      stock_status: "in_stock"
    },
    {
      name: "Pajama Set",
      description: "Two-piece pajama set",
      price: 650,
      original_price: 700,
      brand: "Molu",
      sizes: "2Y,3Y,4Y",
      colors: "Pink,Blue",
      is_active: 1,
      stock_status: "in_stock"
    },
    {
      name: "Socks Pack",
      description: "Pack of 3 soft socks",
      price: 180,
      original_price: null,
      brand: "Molu",
      sizes: "S,M,L",
      colors: "White,Black",
      is_active: 0,
      stock_status: "in_stock"
    },
    {
      name: "Dress",
      description: "Lightweight casual dress",
      price: 900,
      original_price: 1100,
      brand: "Molu",
      sizes: "3Y,4Y,5Y",
      colors: "Yellow,Green",
      is_active: 1,
      stock_status: "in_stock"
    },
    {
      name: "Cap",
      description: "Adjustable cap",
      price: 220,
      original_price: null,
      brand: "Molu",
      sizes: "One Size",
      colors: "Beige,Blue",
      is_active: 1,
      stock_status: "in_stock"
    },
    {
      name: "Baby Blanket",
      description: "Soft blanket for naps",
      price: 1200,
      original_price: null,
      brand: "Molu",
      sizes: "One Size",
      colors: "Cream,Sky",
      is_active: 0,
      stock_status: "in_stock"
    }
  ];

  for (const p of demoProducts) {
    await request(`/api/v1/db/data/v1/${projectId}/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(p)
    });
  }

  const products = (await request(`/api/v1/db/data/v1/${projectId}/products?limit=200&offset=0`)).json?.list ?? [];
  const productByName = new Map(products.map((p) => [p?.name, p]));

  const demoProductImages = [
    { name: "Onesie", images: ["https://images.pexels.com/photos/1619690/pexels-photo-1619690.jpeg", "https://images.pexels.com/photos/1619702/pexels-photo-1619702.jpeg"] },
    { name: "T-Shirt", images: ["https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg"] },
    { name: "Hoodie", images: ["https://images.pexels.com/photos/5699109/pexels-photo-5699109.jpeg"] },
    { name: "Pajama Set", images: ["https://images.pexels.com/photos/5699107/pexels-photo-5699107.jpeg"] },
    { name: "Socks Pack", images: ["https://images.pexels.com/photos/19090/pexels-photo.jpg"] },
    { name: "Dress", images: ["https://images.pexels.com/photos/5325587/pexels-photo-5325587.jpeg"] },
    { name: "Cap", images: ["https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg"] },
    { name: "Baby Blanket", images: ["https://images.pexels.com/photos/1619691/pexels-photo-1619691.jpeg"] }
  ];

  for (const entry of demoProductImages) {
    const product = productByName.get(entry.name);
    if (!product?.id) continue;
    for (let i = 0; i < entry.images.length; i++) {
      await request(`/api/v1/db/data/v1/${projectId}/product_images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          image_url: entry.images[i],
          display_order: i + 1,
          is_primary: i === 0 ? 1 : 0
        })
      });
    }
  }

  for (const product of products) {
    if (!product?.id || !product?.sizes || !product?.colors) continue;
    const sizes = String(product.sizes).split(",").map((s) => s.trim()).filter(Boolean);
    const colors = String(product.colors).split(",").map((s) => s.trim()).filter(Boolean);
    const sizeA = sizes[0] ?? "One Size";
    const sizeB = sizes[1] ?? sizeA;
    const colorA = colors[0] ?? "Default";
    const colorB = colors[1] ?? colorA;

    await request(`/api/v1/db/data/v1/${projectId}/product_inventory`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        product_id: product.id,
        size: sizeA,
        color: colorA,
        stock_qty: 12,
        low_stock_threshold: 3
      })
    });

    await request(`/api/v1/db/data/v1/${projectId}/product_inventory`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        product_id: product.id,
        size: sizeB,
        color: colorB,
        stock_qty: 2,
        low_stock_threshold: 3
      })
    });
  }

  const demoOrders = [
    {
      id: "ORD-DEMO-001",
      customer_name: "Amina Rahman",
      customer_phone: "+8801711111111",
      customer_email: "amina@example.com",
      customer_address: "House 12, Road 7",
      customer_district: "Dhaka",
      special_instructions: "Call before delivery",
      payment_method: "bkash",
      payment_status: "pending",
      payment_id: null,
      order_status: "pending",
      items: [
        { product: "Onesie", size: "6M", color: "White", quantity: 1 },
        { product: "T-Shirt", size: "2Y", color: "Blue", quantity: 2 }
      ]
    },
    {
      id: "ORD-DEMO-002",
      customer_name: "Tanvir Ahmed",
      customer_phone: "+8801722222222",
      customer_email: "tanvir@example.com",
      customer_address: "Apartment 3B, Block C",
      customer_district: "Chattogram",
      special_instructions: null,
      payment_method: "cod",
      payment_status: "pending",
      payment_id: null,
      order_status: "confirmed",
      items: [{ product: "Hoodie", size: "4Y", color: "Navy", quantity: 1 }]
    },
    {
      id: "ORD-DEMO-003",
      customer_name: "Nusrat Jahan",
      customer_phone: "+8801733333333",
      customer_email: "nusrat@example.com",
      customer_address: "Lane 4, House 9",
      customer_district: "Sylhet",
      special_instructions: "Leave at reception",
      payment_method: "nagad",
      payment_status: "completed",
      payment_id: "PAY-DEMO-003",
      order_status: "shipped",
      items: [
        { product: "Pajama Set", size: "3Y", color: "Pink", quantity: 1 },
        { product: "Cap", size: "One Size", color: "Blue", quantity: 1 }
      ]
    },
    {
      id: "ORD-DEMO-004",
      customer_name: "Farhan Kabir",
      customer_phone: "+8801744444444",
      customer_email: "farhan@example.com",
      customer_address: "Sector 10, Road 2",
      customer_district: "Dhaka",
      special_instructions: null,
      payment_method: "bkash",
      payment_status: "completed",
      payment_id: "PAY-DEMO-004",
      order_status: "delivered",
      items: [
        { product: "Dress", size: "4Y", color: "Yellow", quantity: 1 },
        { product: "T-Shirt", size: "3Y", color: "Red", quantity: 1 }
      ]
    },
    {
      id: "ORD-DEMO-005",
      customer_name: "Shila Akter",
      customer_phone: "+8801755555555",
      customer_email: "shila@example.com",
      customer_address: "House 2, Road 1",
      customer_district: "Rajshahi",
      special_instructions: "Ring the bell twice",
      payment_method: "cod",
      payment_status: "pending",
      payment_id: null,
      order_status: "cancelled",
      items: [{ product: "Onesie", size: "12M", color: "Blue", quantity: 1 }]
    },
    {
      id: "ORD-DEMO-006",
      customer_name: "Imran Hossain",
      customer_phone: "+8801766666666",
      customer_email: "imran@example.com",
      customer_address: "Block A, Building 5",
      customer_district: "Khulna",
      special_instructions: null,
      payment_method: "nagad",
      payment_status: "completed",
      payment_id: "PAY-DEMO-006",
      order_status: "confirmed",
      items: [
        { product: "Hoodie", size: "5Y", color: "Gray", quantity: 1 },
        { product: "Pajama Set", size: "2Y", color: "Blue", quantity: 1 }
      ]
    }
  ];

  for (const o of demoOrders) {
    const detailedItems = o.items
      .map((item) => {
        const product = productByName.get(item.product);
        if (!product?.id || typeof product.price !== "number") return null;
        return {
          order_id: o.id,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          subtotal: product.price * item.quantity
        };
      })
      .filter(Boolean);

    const total = detailedItems.reduce((sum, item) => sum + item.subtotal, 0);

    await request(`/api/v1/db/data/v1/${projectId}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: o.id,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        customer_email: o.customer_email,
        customer_address: o.customer_address,
        customer_district: o.customer_district,
        special_instructions: o.special_instructions,
        total_amount: total,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        payment_id: o.payment_id,
        order_status: o.order_status
      })
    });

    for (const item of detailedItems) {
      await request(`/api/v1/db/data/v1/${projectId}/order_items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item)
      });
    }
  }

  process.stdout.write("ok\n");
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
