"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
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
      const data = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      if (data.user.role !== "PATIENT") {
        setError("Cet espace est réservé aux patients. Connectez-vous via l'espace médecin.");
        return;
      }
      setAuth(data);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Identifiants invalides");
      } else {
        setError("Erreur réseau");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-brand-dark">Connexion</h1>
        <p className="mt-1 text-sm text-gray-600">
          Accédez à votre espace patient
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <Field
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-brand">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}
