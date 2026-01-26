import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ProductCard", () => {
  const product = {
    id: "1",
    name: "Baby Onesie",
    price: 500,
    sizes: ["6M", "12M"],
    colors: ["White"],
    image: "http://example.test/img.jpg",
    category: "Clothing",
    rating: 4.8,
    reviews: 10,
    isNew: false,
    isSale: false,
    description: "Soft onesie"
  };

  it("renders product name and price", async () => {
    vi.resetModules();
    const { ProductCard } = await import("@/components/product/ProductCard");
    render(<ProductCard product={product} />);
    expect(screen.getByText("Baby Onesie")).toBeInTheDocument();
    expect(screen.getByText("৳500")).toBeInTheDocument();
  }, 15000);

  it("adds item to cart when button clicked", async () => {
    vi.resetModules();
    const addItem = vi.fn();
    vi.doMock("@/store/cart", () => ({
      useCart: (selector: any) => selector({ addItem })
    }));
    const { ProductCard } = await import("@/components/product/ProductCard");
    render(<ProductCard product={product} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "1",
        options: { "Age Range": "6M", Color: "White" },
        quantity: 1
      })
    );
    vi.unmock("@/store/cart");
  }, 15000);

  it("renders add to cart button", async () => {
    vi.resetModules();
    const { ProductCard } = await import("@/components/product/ProductCard");
    render(<ProductCard product={product} />);
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeInTheDocument();
  });
});
