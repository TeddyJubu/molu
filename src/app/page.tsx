import { Hero } from "@/components/home/Hero";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { Testimonials } from "@/components/home/Testimonials";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-6 text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-foreground">
          Home
        </Link>
      </nav>
      <Hero />
      <FeaturedCategories />
      <TrendingProducts />
      <Testimonials />
    </div>
  );
}
