import { act } from "react";
import { describe, expect, it } from "vitest";
import { useCart } from "./cart";

describe("cart store", () => {
  it("adds a new item", () => {
    const store = useCart.getState();
    act(() => {
      store.clear();
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 1,
        image: "/onesie.jpg"
      });
    });

    expect(useCart.getState().items).toHaveLength(1);
  });

  it("merges quantities for same product+size+color", () => {
    const store = useCart.getState();
    act(() => {
      store.clear();
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 1,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 2,
        image: "/onesie.jpg"
      });
    });

    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0]?.quantity).toBe(3);
  });

  it("calculates totals across items", () => {
    const store = useCart.getState();
    act(() => {
      store.clear();
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 2,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "2",
        name: "T-Shirt",
        price: 300,
        size: "2Y",
        color: "Blue",
        quantity: 1,
        image: "/shirt.jpg"
      });
    });

    expect(useCart.getState().total()).toBe(1300);
  });

  it("removes a specific variant", () => {
    const store = useCart.getState();
    act(() => {
      store.clear();
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 1,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "12M",
        color: "White",
        quantity: 1,
        image: "/onesie.jpg"
      });
      store.removeItem({ productId: "1", size: "6M", color: "White" });
    });

    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0]?.size).toBe("12M");
  });

  it("updates quantity and clamps at 1", () => {
    const store = useCart.getState();
    act(() => {
      store.clear();
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 2,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "2",
        name: "T-Shirt",
        price: 300,
        size: "2Y",
        color: "Blue",
        quantity: 1,
        image: "/shirt.jpg"
      });
      store.updateQuantity({ productId: "1", size: "6M", color: "White" }, 0);
      store.updateQuantity({ productId: "nope", size: "X", color: "Y" }, 99);
    });

    const items = useCart.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.productId === "1")?.quantity).toBe(1);
    expect(items.find((i) => i.productId === "2")?.quantity).toBe(1);
  });
});
