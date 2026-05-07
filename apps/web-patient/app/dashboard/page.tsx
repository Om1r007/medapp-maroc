"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import type { Consultation } from "@medapp/shared-types";

const ACTIVE_STATUSES = ["WAITING_PAYMENT", "IN_QUEUE", "MATCHED", "IN_PROGRESS"] as const;
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

interface ActiveConsultation {
  id: string;
  status: ActiveStatus;
  reason: string | null;
  amount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<Consultation["status"], string> = {
  WAITING_PAYMENT: "En attente de paiement",
  IN_QUEUE: "Dans la file",
  MATCHED: "Médecin assigné",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

const STATUS_COLORS: Record<Consultation["status"], string> = {
  WAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
  IN_QUEUE: "bg-blue-100 text-blue-800",
  MATCHED: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  REFUNDED: "bg-gray-100 text-gray-600",
};

function getActiveRedirect(status: ActiveStatus, id: string): string {
  if (status === "WAITING_PAYMENT") return `/payment/${id}`;
  if (status === "IN_QUEUE") return `/queue/${id}`;
  return `/consultation/${id}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const { data: consultations } = useQuery({
    queryKey: ["consultations-me"],
    queryFn: () => api.get<Consultation[]>("/consultations/me"),
    enabled: !!user,
  });

  const { data: activeConsultation } = useQuery({
    queryKey: ["consultation-active"],
    queryFn: () => api.get<ActiveConsultation | null>("/consultations/me/active"),
    enabled: !!user,
  });

  if (!user) return null;

  const recent = consultations?.slice(0, 5) ?? [];

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
            Consultez un médecin en quelques minutes. Tarif : 150 MAD.
          </p>

          {activeConsultation ? (
            <div className="mt-4">
              <button
                onClick={() =>
                  router.push(getActiveRedirect(activeConsultation.status, activeConsultation.id))
                }
                className="rounded-lg bg-amber-500 px-6 py-3 font-medium text-white hover:bg-amber-600"
              >
                Reprendre ma consultation en cours →
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Vous ne pouvez démarrer qu'une consultation à la fois.{" "}
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[activeConsultation.status]}`}>
                  {STATUS_LABELS[activeConsultation.status]}
                </span>
              </p>
            </div>
          ) : (
            <button
              onClick={() => router.push("/consultations/new")}
              className="mt-4 rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand/90"
            >
              Consulter un médecin maintenant
            </button>
          )}
        </section>

        <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Mes consultations récentes</h2>

          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">
              Aucune consultation pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {recent.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg"
                  onClick={() => {
                    if (c.status === "WAITING_PAYMENT" || c.paymentStatus === "FAILED") {
                      router.push(`/payment/${c.id}`);
                    } else if (c.status === "IN_QUEUE") {
                      router.push(`/queue/${c.id}`);
                    } else if (c.status === "MATCHED" || c.status === "IN_PROGRESS") {
                      router.push(`/consultation/${c.id}`);
                    } else if (c.status === "COMPLETED") {
                      router.push(`/consultations/${c.id}/summary`);
                    }
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {c.reason ?? "Consultation médicale"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {c.amount} MAD
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[c.status]}`}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
