"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/store/cart";
import { ShoppingBag, Menu, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartSheetContent } from "@/components/cart/CartSheetContent";
import { Input } from "@/components/ui/input";
import { useWishlist } from "@/store/wishlist";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itemCount = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlist((s) => s.productIds.length);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");

  const currentQuery = useMemo(() => (searchParams.get("query") ?? "").trim(), [searchParams]);
  const activeCategory = useMemo(() => (searchParams.get("category") ?? "").trim(), [searchParams]);
  const onProducts = pathname.startsWith("/products");
  const onWishlist = pathname.startsWith("/wishlist");
  const onAdmin = pathname.startsWith("/admin");

  const desktopNavLinkClass = (active: boolean) =>
    `relative transition-colors hover:text-primary after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-0.5 after:rounded-full after:bg-primary after:transition-opacity ${
      active ? "text-primary after:opacity-100" : "after:opacity-0"
    }`;

  const mobileNavLinkClass = (active: boolean) =>
    `rounded-md px-3 py-2 text-lg font-medium transition-colors ${
      active ? "bg-primary/10 text-primary" : "hover:bg-muted hover:text-primary"
    }`;

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  if (onAdmin) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Mobile Menu Trigger (Placeholder for now) */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
             <SheetHeader>
              <SheetTitle className="text-left font-baloo text-2xl text-primary">Molu Kids</SheetTitle>
            </SheetHeader>
            <form
              className="mt-6 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const nextQuery = query.trim();
                const params = new URLSearchParams();
                if (nextQuery) params.set("query", nextQuery);
                const suffix = params.toString();
                router.push(suffix ? `/products?${suffix}` : "/products");
              }}
            >
              <label className="sr-only" htmlFor="site-search-mobile">
                Search products
              </label>
              <Input
                id="site-search-mobile"
                type="search"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" size="icon" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <nav className="mt-8 flex flex-col gap-1">
              <Link
                href="/"
                aria-current={!onProducts && pathname === "/" ? "page" : undefined}
                className={mobileNavLinkClass(!onProducts && pathname === "/")}
              >
                Home
              </Link>
              <Link
                href="/products"
                aria-current={onProducts && !activeCategory ? "page" : undefined}
                className={mobileNavLinkClass(onProducts && !activeCategory)}
              >
                Shop All
              </Link>
              <Link
                href="/products?category=boys"
                aria-current={onProducts && activeCategory === "boys" ? "page" : undefined}
                className={mobileNavLinkClass(onProducts && activeCategory === "boys")}
              >
                Boys
              </Link>
              <Link
                href="/products?category=girls"
                aria-current={onProducts && activeCategory === "girls" ? "page" : undefined}
                className={mobileNavLinkClass(onProducts && activeCategory === "girls")}
              >
                Girls
              </Link>
              <Link
                href="/wishlist"
                aria-current={onWishlist ? "page" : undefined}
                className={mobileNavLinkClass(onWishlist)}
              >
                Wishlist
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-baloo text-2xl font-bold text-primary tracking-tight">Molu Kids</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/products"
            aria-current={onProducts && !activeCategory ? "page" : undefined}
            className={desktopNavLinkClass(onProducts && !activeCategory)}
          >
            Shop All
          </Link>
          <Link
            href="/products?category=boys"
            aria-current={onProducts && activeCategory === "boys" ? "page" : undefined}
            className={desktopNavLinkClass(onProducts && activeCategory === "boys")}
          >
            Boys
          </Link>
          <Link
            href="/products?category=girls"
            aria-current={onProducts && activeCategory === "girls" ? "page" : undefined}
            className={desktopNavLinkClass(onProducts && activeCategory === "girls")}
          >
            Girls
          </Link>
          <Link
            href="/products?category=toddlers"
            aria-current={onProducts && activeCategory === "toddlers" ? "page" : undefined}
            className={desktopNavLinkClass(onProducts && activeCategory === "toddlers")}
          >
            Toddlers
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
            <form
              className="hidden md:flex relative w-full max-w-sm items-center"
              onSubmit={(e) => {
                e.preventDefault();
                const nextQuery = query.trim();
                const params = new URLSearchParams();

                if (pathname.startsWith("/products")) {
                  for (const [k, v] of searchParams.entries()) params.set(k, v);
                }

                if (nextQuery) params.set("query", nextQuery);
                else params.delete("query");

                const suffix = params.toString();
                router.push(suffix ? `/products?${suffix}` : "/products");
              }}
            >
              <label className="sr-only" htmlFor="site-search">
                Search products
              </label>
              <Input
                id="site-search"
                type="search"
                placeholder="Search products..."
                className="h-9 w-[220px] pr-10 lg:w-[320px]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-1 h-8 w-8"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/wishlist" aria-label="Open wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]">
                  {wishlistCount}
                </Badge>
              )}
            </Link>
          </Button>

          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]">
                    {itemCount}
                  </Badge>
                )}
                <span className="sr-only">Open cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Shopping Cart</SheetTitle>
              </SheetHeader>
              <CartSheetContent onNavigate={() => setCartOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
