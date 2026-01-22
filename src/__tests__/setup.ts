import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { alt, fill: _fill, ...rest } = props ?? {};
    return React.createElement("img", { alt, ...rest });
  }
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children)
}));
