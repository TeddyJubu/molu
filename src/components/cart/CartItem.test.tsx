import { fireEvent, render, screen } from "@testing-library/react";
import { CartItem } from "@/components/cart/CartItem";

describe("CartItem", () => {
  const item = {
    productId: "p1",
    name: "Onesie",
    price: 500,
    size: "6M",
    color: "White",
    quantity: 2,
    image: ""
  };

  it("renders item basics", () => {
    render(<CartItem item={item} onRemove={() => {}} onQuantityChange={() => {}} />);
    expect(screen.getByText("Onesie")).toBeInTheDocument();
    expect(screen.getByText("৳500")).toBeInTheDocument();
    expect(screen.getByText(/Size: 6M/)).toBeInTheDocument();
  });

  it("calls onQuantityChange for +/-", () => {
    const onQuantityChange = vi.fn();
    render(<CartItem item={item} onRemove={() => {}} onQuantityChange={onQuantityChange} />);

    fireEvent.click(screen.getByLabelText("Decrease quantity"));
    fireEvent.click(screen.getByLabelText("Increase quantity"));

    expect(onQuantityChange).toHaveBeenCalledWith({ productId: "p1", size: "6M", color: "White" }, 1);
    expect(onQuantityChange).toHaveBeenCalledWith({ productId: "p1", size: "6M", color: "White" }, 3);
  });

  it("calls onRemove", () => {
    const onRemove = vi.fn();
    render(<CartItem item={item} onRemove={onRemove} onQuantityChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith({ productId: "p1", size: "6M", color: "White" });
  });

  it("renders image when present", () => {
    render(
      <CartItem
        item={{ ...item, image: "http://example.test/img.jpg" }}
        onRemove={() => {}}
        onQuantityChange={() => {}}
      />
    );
    expect(screen.getByAltText("Onesie")).toBeInTheDocument();
  });
});
