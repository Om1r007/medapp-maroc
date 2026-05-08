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
          localStorage.setItem("doctorAccessToken", accessToken);
        }
        set({ user, accessToken, refreshToken });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("doctorAccessToken");
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "medapp-doctor-auth" },
  ),
);
