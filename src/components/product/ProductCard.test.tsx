import { fireEvent, render, screen } from "@testing-library/react";

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
  });

  it("adds item to cart when button clicked", async () => {
    vi.resetModules();
    const addItem = vi.fn();
    vi.doMock("@/store/cart", () => ({
      useCart: (selector: any) => selector({ addItem })
    }));
    const { ProductCard } = await import("@/components/product/ProductCard");
    render(<ProductCard product={product} />);
    fireEvent.click(screen.getByRole("button", { name: "Quick Add" }));
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "1",
        size: "6M",
        color: "White",
        quantity: 1
      })
    );
    vi.unmock("@/store/cart");
  });

  it("renders quick add button", async () => {
    vi.resetModules();
    const { ProductCard } = await import("@/components/product/ProductCard");
    render(<ProductCard product={product} />);
    expect(screen.getByRole("button", { name: "Quick Add" })).toBeInTheDocument();
  });
});
