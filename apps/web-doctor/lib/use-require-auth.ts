"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./auth-store";

export function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "DOCTOR") {
      logout();
      router.push("/login");
    }
  }, [user, router, logout]);

  return user?.role === "DOCTOR" ? user : null;
}
