"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const patientUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL ?? "http://localhost:3000";

const navLinks = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/medecins", label: "Médecins" },
  { href: "/securite", label: "Sécurité" },
];

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="font-bold text-lg text-neutral-900 tracking-tight">Medapp</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={`${patientUrl}/login`}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            Connexion
          </a>
          <a
            href={`${patientUrl}/consultations/new`}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors"
          >
            Consulter →
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden rounded-lg p-2 hover:bg-neutral-100 transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className={cn("mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4")}>
            <a
              href={`${patientUrl}/login`}
              className="py-2.5 text-sm font-medium text-neutral-700"
              onClick={() => setMobileOpen(false)}
            >
              Connexion
            </a>
            <a
              href={`${patientUrl}/consultations/new`}
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center h-11 px-4 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors"
            >
              Consulter maintenant →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
