import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="font-baloo text-4xl font-bold text-primary">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/products">Shop products</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}

