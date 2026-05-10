"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";

interface TopBarProps {
  minimal?: boolean;
}

export function TopBar({ minimal = false }: TopBarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navLinks = [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/consultations", label: "Consultations" },
    { href: "/profile", label: "Profil" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 h-16">
      <div className="mx-auto max-w-7xl px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">
            Medapp
          </span>
        </Link>

        {!minimal && (
          <>
            {/* Desktop nav links */}
            {user && (
              <nav className="hidden md:flex items-center gap-6">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      pathname.startsWith(href)
                        ? "text-primary-600"
                        : "text-neutral-700 hover:text-neutral-900",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={logout}
                  className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  Déconnexion
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center h-9 px-4 text-sm font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                  >
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
