"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { heroSlides } from "@/lib/demo-data";

export function Hero() {
  return (
    <section className="w-full">
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden md:h-[60vh]">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover brightness-75"
                  priority={slide.id === 1}
                  sizes="100vw"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <h1 className="mb-4 max-w-2xl font-baloo text-4xl font-bold leading-tight md:text-6xl drop-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="mb-8 max-w-lg text-lg font-medium md:text-xl drop-shadow-md">
                    {slide.subtitle}
                  </p>
                  <Button asChild size="lg" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8">
                    <Link href={slide.link}>{slide.cta}</Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </section>
  );
}
