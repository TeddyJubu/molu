import { fireEvent, render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/product/ProductCard";

describe("ProductCard", () => {
  const product = {
    id: "1",
    name: "Baby Onesie",
    price: 500,
    sizes: ["6M", "12M"],
    colors: ["White"],
    image: null
  };

  it("renders product name and price", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("Baby Onesie")).toBeInTheDocument();
    expect(screen.getByText("৳500")).toBeInTheDocument();
  });

  it("calls onAddToCart when button clicked", () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={product} onAddToCart={onAddToCart} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(onAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "1",
        size: "6M",
        color: "White",
        quantity: 1
      })
    );
  });

  it("disables button when onAddToCart missing", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeDisabled();
  });
});
