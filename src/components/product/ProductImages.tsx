"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProductImage } from "@/types";

export interface ProductImagesProps {
  images: ProductImage[];
}

export function ProductImages({ images }: ProductImagesProps) {
  const ordered = useMemo(() => {
    const primary = images.find((i) => i.is_primary);
    if (!primary) return images;
    return [primary, ...images.filter((i) => i.id !== primary.id)];
  }, [images]);

  const [active, setActive] = useState(ordered[0]?.image_url ?? null);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded bg-gray-100">
        {active ? (
          <Image src={active} alt="Product image" fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No images</div>
        )}
      </div>

      {ordered.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {ordered.map((img) => (
            <button
              type="button"
              key={img.id}
              onClick={() => setActive(img.image_url)}
              className="relative h-16 w-16 flex-none overflow-hidden rounded border bg-gray-100"
              aria-label="Select product image"
            >
              <Image src={img.image_url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
