"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/auth-store";

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">
              Dr. {user.email}
            </h1>
            <p className="text-sm text-gray-600">Tableau de bord praticien</p>
          </div>
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

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Statut de disponibilité
              </h2>
              <p className="text-sm text-gray-600">
                Activez pour recevoir des patients de la file d'attente
              </p>
            </div>
            <button
              onClick={() => setAvailable((v) => !v)}
              className={`relative h-8 w-14 rounded-full transition ${
                available ? "bg-brand" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                  available ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
          <p className={`mt-4 text-sm font-medium ${available ? "text-green-700" : "text-gray-500"}`}>
            {available ? "✓ Disponible — vous recevez les patients" : "Indisponible"}
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Consultations aujourd'hui" value="0" />
          <Stat label="En attente dans la file" value="—" />
          <Stat label="Revenus du mois (MAD)" value="0" />
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Prochaines fonctionnalités</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>• Salle de consultation vidéo (Daily.co)</li>
            <li>• Calendrier de disponibilité</li>
            <li>• Comptes-rendus & ordonnances</li>
            <li>• Facturation mensuelle</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}
