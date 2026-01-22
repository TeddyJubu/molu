import "./globals.css";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Baloo_2 } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const baloo = Baloo_2({ 
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Molu Kids Store",
  description: "Playful and trendy clothing for kids",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-background text-foreground antialiased",
        baloo.className
      )}>
        <Header />
        <main>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
