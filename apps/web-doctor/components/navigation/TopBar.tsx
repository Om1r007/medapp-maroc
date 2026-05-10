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
    { href: "/calendar", label: "Calendrier" },
    { href: "/feedback", label: "Avis" },
    { href: "/invoices", label: "Factures" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 h-16">
      <div className="mx-auto max-w-7xl px-6 h-full flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">
            Medapp <span className="text-neutral-400 font-normal">Praticien</span>
          </span>
        </Link>

        {!minimal && (
          <>
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

            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={logout}
                  className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  Déconnexion
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  Connexion
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
