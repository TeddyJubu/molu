import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LogoutButton } from "./LogoutButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LogoutButton", () => {
  it("logs out successfully", async () => {
    const mockPush = vi.fn();
    const mockRefresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as any);

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
    } as any);

    render(<LogoutButton />);

    const button = screen.getByText("Logout");
    fireEvent.click(button);
    fireEvent.click(screen.getByText("Log out"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/login", {
        method: "DELETE",
      });
      expect(toast.success).toHaveBeenCalledWith("Logged out successfully");
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("handles logout error", async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);

    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<LogoutButton />);

    const button = screen.getByText("Logout");
    fireEvent.click(button);
    fireEvent.click(screen.getByText("Log out"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An error occurred during logout");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
