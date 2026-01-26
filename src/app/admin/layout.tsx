import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">Orders, products, and operational tools.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/admin" className="rounded border px-3 py-1 hover:bg-muted">
            Overview
          </Link>
          <Link href="/admin/orders" className="rounded border px-3 py-1 hover:bg-muted">
            Orders
          </Link>
          <Link href="/admin/products" className="rounded border px-3 py-1 hover:bg-muted">
            Products
          </Link>
          <Link href="/admin" aria-label="Admin overview">
            <Badge variant="secondary" className="cursor-pointer">
              Admin
            </Badge>
          </Link>
          <div className="ml-2 border-l pl-3">
            <LogoutButton />
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
