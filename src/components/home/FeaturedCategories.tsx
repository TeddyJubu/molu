import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { categories } from "@/lib/demo-data";

export function FeaturedCategories() {
  return (
    <section className="container mx-auto py-12 px-4">
      <h2 className="mb-8 text-center font-baloo text-3xl font-bold text-primary md:text-4xl">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/products?category=${category.id}`}>
            <Card className="group overflow-hidden border-none shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-0">
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                    <h3 className="font-baloo text-xl font-bold">{category.name}</h3>
                    <p className="text-sm font-medium text-white/90">{category.count} Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
