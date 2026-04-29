"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";
import type { AuthResponse, SignupPatientDto } from "@medapp/shared-types";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState<SignupPatientDto>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+212",
    password: "",
    cin: "",
    dateOfBirth: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignupPatientDto>(
    key: K,
    value: SignupPatientDto[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>("/auth/signup/patient", form);
      setAuth(data);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        const msg =
          (err.payload as { message?: string | string[] })?.message ??
          "Erreur lors de l'inscription";
        setError(Array.isArray(msg) ? msg.join(", ") : msg);
      } else {
        setError("Erreur réseau");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-brand-dark">Créer un compte patient</h1>

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-2 gap-4">
          <Field
            label="Prénom"
            value={form.firstName}
            onChange={(v) => update("firstName", v)}
          />
          <Field
            label="Nom"
            value={form.lastName}
            onChange={(v) => update("lastName", v)}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            full
          />
          <Field
            label="Téléphone (+212…)"
            value={form.phone}
            onChange={(v) => update("phone", v)}
            full
          />
          <Field
            label="CIN"
            value={form.cin}
            onChange={(v) => update("cin", v.toUpperCase())}
          />
          <Field
            label="Date de naissance"
            type="date"
            value={form.dateOfBirth}
            onChange={(v) => update("dateOfBirth", v)}
          />
          <Field
            label="Mot de passe (min. 8 car.)"
            type="password"
            value={form.password}
            onChange={(v) => update("password", v)}
            full
          />

          {error && (
            <p className="col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 rounded-lg bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-brand">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  full,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <label className={full ? "col-span-2" : "col-span-1"}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}
