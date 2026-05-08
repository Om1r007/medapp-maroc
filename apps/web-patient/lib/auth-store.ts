"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@medapp/shared-types";

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: {
    user: PublicUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: ({ user, accessToken, refreshToken }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("patientAccessToken", accessToken);
        }
        set({ user, accessToken, refreshToken });
      },
      logout: () => {
        import("@daily-co/daily-js").then((mod) => {
          try {
            const existing = mod.default.getCallInstance();
            if (existing) existing.destroy().catch(() => {});
          } catch {}
        }).catch(() => {});
        if (typeof window !== "undefined") {
          localStorage.removeItem("patientAccessToken");
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "medapp-patient-auth" },
  ),
);
