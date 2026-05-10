"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AuthResponse } from "@medapp/shared-types";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>("/auth/login", { email, password });
      if (data.user.role !== "DOCTOR") {
        setError("Cet espace est réservé aux médecins. Connectez-vous via l'espace patient.");
        return;
      }
      setAuth(data);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Identifiants invalides. Vérifiez votre email et mot de passe.");
      } else {
        setError("Erreur réseau. Réessayez dans quelques instants.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">
            Medapp <span className="text-neutral-400 font-normal">Praticien</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-neutral-900">
                Connexion praticien
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Accédez à votre espace médecin
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <Input
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="docteur@email.com"
                iconLeft={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                iconLeft={<Lock className="h-4 w-4" />}
                required
                autoComplete="current-password"
                errorMessage={error ?? undefined}
              />

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Se connecter
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              Pas encore inscrit ?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Créer un compte praticien
              </Link>
            </p>

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-center text-xs text-neutral-400">
                Espace patient ?{" "}
                <a
                  href="http://localhost:3000/login"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Connexion patient
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
