import { fireEvent, render, screen } from "@testing-library/react";
import { CartItem } from "@/components/cart/CartItem";
import { describe, expect, it, vi } from "vitest";

describe("CartItem", () => {
  const item = {
    productId: "p1",
    name: "Onesie",
    price: 500,
    options: { "Age Range": "6M", Color: "White" },
    quantity: 2,
    image: "",
    lineKey: "p1::test"
  };

  it("renders item basics", () => {
    render(<CartItem item={item} onRemove={() => {}} onQuantityChange={() => {}} />);
    expect(screen.getByText("Onesie")).toBeInTheDocument();
    expect(screen.getByText("৳1000")).toBeInTheDocument();
    expect(screen.getByText(/Age Range/)).toBeInTheDocument();
  });

  it("calls onQuantityChange for +/-", () => {
    const onQuantityChange = vi.fn();
    render(<CartItem item={item} onRemove={() => {}} onQuantityChange={onQuantityChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Decrease" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase" }));

    expect(onQuantityChange).toHaveBeenCalledWith({ lineKey: "p1::test" }, 1);
    expect(onQuantityChange).toHaveBeenCalledWith({ lineKey: "p1::test" }, 3);
  }, 15000);

  it("calls onRemove", () => {
    const onRemove = vi.fn();
    render(<CartItem item={item} onRemove={onRemove} onQuantityChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith({ lineKey: "p1::test" });
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
