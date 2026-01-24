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
        options: { "Age Range": "6M", Color: "White" },
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
        options: { "Age Range": "6M", Color: "White" },
        quantity: 1,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        options: { "Age Range": "6M", Color: "White" },
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
        options: { "Age Range": "6M", Color: "White" },
        quantity: 2,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "2",
        name: "T-Shirt",
        price: 300,
        options: { "Age Range": "2Y", Color: "Blue" },
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
        options: { "Age Range": "6M", Color: "White" },
        quantity: 1,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        options: { "Age Range": "12M", Color: "White" },
        quantity: 1,
        image: "/onesie.jpg"
      });
    });

    const first = useCart.getState().items.find((i) => i.productId === "1" && i.options["Age Range"] === "6M");
    act(() => {
      if (first) store.removeItem({ lineKey: first.lineKey });
    });

    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0]?.options["Age Range"]).toBe("12M");
  });

  it("updates quantity and clamps at 1", () => {
    const store = useCart.getState();
    act(() => {
      store.clear();
      store.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        options: { "Age Range": "6M", Color: "White" },
        quantity: 2,
        image: "/onesie.jpg"
      });
      store.addItem({
        productId: "2",
        name: "T-Shirt",
        price: 300,
        options: { "Age Range": "2Y", Color: "Blue" },
        quantity: 1,
        image: "/shirt.jpg"
      });
    });

    const first = useCart.getState().items.find((i) => i.productId === "1");
    act(() => {
      if (first) store.updateQuantity({ lineKey: first.lineKey }, 0);
      store.updateQuantity({ lineKey: "nope" }, 99);
    });
    const items = useCart.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.productId === "1")?.quantity).toBe(1);
    expect(items.find((i) => i.productId === "2")?.quantity).toBe(1);
  });
});
