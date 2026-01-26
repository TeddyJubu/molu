import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

describe("admin journey", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("redirects /admin to /admin/login when session cookie is missing", async () => {
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://example.test/admin");
    const res = middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toBe("http://example.test/admin/login");
  });

  it("allows /admin when session cookie exists", async () => {
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://example.test/admin", {
      headers: { cookie: "admin_session=true" }
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("renders admin overview counts from orders", async () => {
    const listOrders = vi.fn().mockResolvedValue([
      order({ id: "ORD-1", order_status: "pending", payment_status: "pending" }),
      order({ id: "ORD-2", order_status: "confirmed", payment_status: "completed" }),
      order({ id: "ORD-3", order_status: "confirmed", payment_status: "completed" })
    ]);

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        listOrders = listOrders;
      }
    }));

    const { default: AdminPage } = await import("@/app/admin/page");
    render(await AdminPage());

    expect(screen.getByText("Manage orders")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders orders list and filters when NocoDB is available", async () => {
    const listOrders = vi.fn().mockResolvedValue([
      order({ id: "ORD-DEMO-001", order_status: "pending", payment_status: "pending", customer_name: "Amina Rahman" }),
      order({ id: "ORD-DEMO-002", order_status: "confirmed", payment_status: "completed", customer_name: "Tanvir Ahmed" })
    ]);

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        listOrders = listOrders;
      }
    }));

    const { default: AdminOrdersPage } = await import("@/app/admin/orders/page");
    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({})
      })
    );

    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getAllByText("ORD-DEMO-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ORD-DEMO-002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Amina Rahman").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tanvir Ahmed").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Pending" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Confirmed" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Paid" })).toBeInTheDocument();
  }, 20000);

  it("renders order details and items", async () => {
    const getOrder = vi.fn().mockResolvedValue(
      order({
        id: "ORD-DEMO-003",
        order_status: "shipped",
        payment_status: "completed",
        customer_name: "Nusrat Jahan",
        customer_email: "nusrat@example.com"
      })
    );
    const listOrderItems = vi.fn().mockResolvedValue([
      orderItem({ id: "item-1", order_id: "ORD-DEMO-003", product_id: "1", product_name: "Pajama Set", quantity: 1, subtotal: 650 }),
      orderItem({ id: "item-2", order_id: "ORD-DEMO-003", product_id: "2", product_name: "Cap", quantity: 1, subtotal: 220 })
    ]);

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        getOrder = getOrder;
        listOrderItems = listOrderItems;
      }
    }));

    const { default: AdminOrderDetailPage } = await import("@/app/admin/orders/[id]/page");
    render(await AdminOrderDetailPage({ params: Promise.resolve({ id: "ORD-DEMO-003" }) }));

    expect(screen.getByText("ORD-DEMO-003")).toBeInTheDocument();
    expect(screen.getByText(/Nusrat Jahan/)).toBeInTheDocument();
    expect(screen.getByText("Pajama Set")).toBeInTheDocument();
    expect(screen.getByText("Cap")).toBeInTheDocument();
  }, 15000);

  it("renders products list", async () => {
    const listProductsAdmin = vi.fn().mockResolvedValue([
      { id: "1", name: "Onesie", price: 500, sizes: [], colors: [], is_active: true },
      { id: "2", name: "Socks Pack", price: 180, sizes: [], colors: [], is_active: false }
    ]);
    const listFeaturedImages = vi.fn().mockResolvedValue(new Map([["1", "/uploads/products/1/featured.jpg"]]));

    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ refresh: vi.fn() })
    }));
    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        listProductsAdmin = listProductsAdmin;
        listFeaturedImages = listFeaturedImages;
      }
    }));

    const { default: AdminProductsPage } = await import("@/app/admin/products/page");
    render(await AdminProductsPage());

    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getAllByText("Onesie").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Socks Pack").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("Onesie featured").length).toBeGreaterThan(0);
  }, 10000);

  it("updates order status via extracted server action", async () => {
    const updateOrder = vi.fn().mockResolvedValue({});
    const getOrder = vi.fn().mockResolvedValue(
      order({ id: "ORD-DEMO-001", customer_phone: "+8801700000000", order_status: "confirmed" })
    );

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        updateOrder = updateOrder;
        getOrder = getOrder;
      }
    }));

    const { updateOrderStatusAction } = await import("@/app/admin/_actions");
    const { revalidatePath } = await import("next/cache");
    const form = new FormData();
    form.set("orderId", "ORD-DEMO-001");
    form.set("order_status", "confirmed");
    await updateOrderStatusAction(form);

    expect(updateOrder).toHaveBeenCalledWith("ORD-DEMO-001", { order_status: "confirmed" });
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/admin/orders");
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/admin/orders/ORD-DEMO-001");
  });

  it("updates product active flag via extracted server action", async () => {
    const updateProduct = vi.fn().mockResolvedValue({});

    vi.doMock("@/lib/nocodb", () => ({
      isNocoConfigured: () => true,
      NocoDBClient: class {
        updateProduct = updateProduct;
      }
    }));

    const { setProductActiveAction } = await import("@/app/admin/_actions");
    const { revalidatePath } = await import("next/cache");
    const form = new FormData();
    form.set("productId", "1");
    form.set("is_active", "false");
    await setProductActiveAction(form);

    expect(updateProduct).toHaveBeenCalledWith("1", { is_active: false });
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/admin/products");
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/products");
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/products/1");
  });
});

function order(overrides: Partial<any> = {}) {
  return {
    id: "ORD-X",
    customer_name: "Customer",
    customer_phone: "+8801700000000",
    customer_email: "customer@example.com",
    customer_address: "Address",
    customer_district: "Dhaka",
    special_instructions: null,
    total_amount: 100,
    payment_method: "bkash",
    payment_status: "pending",
    payment_id: null,
    order_status: "pending",
    ...overrides
  };
}

function orderItem(overrides: Partial<any> = {}) {
  return {
    id: "item-1",
    order_id: "ORD-X",
    product_id: "1",
    product_name: "Product",
    product_price: 100,
    size: "One Size",
    color: "Default",
    quantity: 1,
    subtotal: 100,
    ...overrides
  };
}
