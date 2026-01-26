import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center">
              <span className="font-baloo text-2xl font-bold tracking-tight text-primary">Molu Kids</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Playful, comfy, and trendy essentials for little explorers.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Shop</p>
            <div className="grid gap-2 text-sm">
              <Link className="text-muted-foreground hover:text-foreground" href="/products">
                Shop All
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/products?category=boys">
                Boys
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/products?category=girls">
                Girls
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/products?category=toddlers">
                Toddlers
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Support</p>
            <div className="grid gap-2 text-sm">
              <Link className="text-muted-foreground hover:text-foreground" href="/contact">
                Contact
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/shipping">
                Shipping & Returns
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/faq">
                FAQ
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Legal</p>
            <div className="grid gap-2 text-sm">
              <Link className="text-muted-foreground hover:text-foreground" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/terms">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Molu Kids Store. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>Secure checkout</span>
            <span>Easy returns</span>
            <span>Fast delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
