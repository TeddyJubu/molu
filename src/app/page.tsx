import { Hero } from "@/components/home/Hero";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { TrendingProducts } from "@/components/home/TrendingProducts";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <Hero />
      <FeaturedCategories />
      <TrendingProducts />
    </div>
  );
}
