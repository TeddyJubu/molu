"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/admin/login");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred during logout");
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
