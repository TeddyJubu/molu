import { render, screen } from "@testing-library/react";
import { ProductGrid } from "@/components/product/ProductGrid";

describe("ProductGrid", () => {
  it("renders empty state when no products", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText("No products found")).toBeInTheDocument();
  });

  it("renders product cards", () => {
    render(
      <ProductGrid
        products={[
          { id: "1", name: "Onesie", price: 500, sizes: ["6M"], colors: ["White"], image: null },
          { id: "2", name: "T-Shirt", price: 650, sizes: ["2Y"], colors: ["Blue"], image: null }
        ]}
      />
    );

    expect(screen.getByText("Onesie")).toBeInTheDocument();
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
  });
});
