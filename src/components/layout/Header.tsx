"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { ShoppingBag, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartSheetContent } from "@/components/cart/CartSheetContent";
import { Input } from "@/components/ui/input";

export function Header() {
  const itemCount = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [cartOpen, setCartOpen] = useState(false);

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
            <nav className="mt-8 flex flex-col gap-4">
              <Link href="/" className="text-lg font-medium hover:text-primary">Home</Link>
              <Link href="/products" className="text-lg font-medium hover:text-primary">Shop All</Link>
              <Link href="/products?category=boys" className="text-lg font-medium hover:text-primary">Boys</Link>
              <Link href="/products?category=girls" className="text-lg font-medium hover:text-primary">Girls</Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-baloo text-2xl font-bold text-primary tracking-tight">Molu Kids</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/products" className="transition-colors hover:text-primary">Shop All</Link>
          <Link href="/products?category=boys" className="transition-colors hover:text-primary">Boys</Link>
          <Link href="/products?category=girls" className="transition-colors hover:text-primary">Girls</Link>
          <Link href="/products?category=toddlers" className="transition-colors hover:text-primary">Toddlers</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
            <div className="hidden md:flex relative w-full max-w-sm items-center">
              <Input type="search" placeholder="Search..." className="h-9 w-[200px] lg:w-[300px]" />
            </div>

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
