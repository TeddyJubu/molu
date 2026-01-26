"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function ProductsSearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = useMemo(() => (searchParams.get("query") ?? "").trim(), [searchParams]);
  const [value, setValue] = useState(currentQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  const replaceQuery = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = next.trim();
    if (normalized) params.set("query", normalized);
    else params.delete("query");
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname);
  };

  const scheduleReplace = (next: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => replaceQuery(next), 250);
  };

  const onClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue("");
    replaceQuery("");
  };

  return (
    <form
      className="mb-6 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        replaceQuery(value);
      }}
    >
      <label htmlFor="products-search" className="sr-only">
        Search products
      </label>
      <div className="relative w-full max-w-xl">
        <Input
          id="products-search"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            scheduleReplace(next);
          }}
          className="h-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value.trim() ? (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} aria-label="Clear">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
          <Button type="submit" variant="ghost" size="icon" className="h-8 w-8" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
