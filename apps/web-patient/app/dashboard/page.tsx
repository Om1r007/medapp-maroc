"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-dark">
            Bienvenue {user.email}
          </h1>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </header>

        <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Démarrer une consultation</h2>
          <p className="mt-2 text-gray-600">
            Bientôt disponible — sera intégré dans la prochaine itération.
          </p>
          <button
            disabled
            className="mt-4 rounded-lg bg-brand px-6 py-3 font-medium text-white opacity-50"
          >
            Consulter un médecin maintenant
          </button>
        </section>
      </div>
    </main>
  );
}
