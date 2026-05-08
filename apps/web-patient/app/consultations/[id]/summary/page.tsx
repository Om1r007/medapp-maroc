"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import type { ConsultationSummary } from "@medapp/shared-types";

export default function ConsultationSummaryPage() {
  const user = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["summary", id],
    queryFn: () => api.get<ConsultationSummary>(`/consultations/${id}/summary`),
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Compte-rendu introuvable.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour au tableau de bord
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">
                Compte-rendu de consultation
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {summary.createdAt
                  ? new Date(summary.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
                {summary.durationMinutes !== null && (
                  <> · Durée : {summary.durationMinutes} min</>
                )}
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Terminée
            </span>
          </div>

          <dl className="mt-8 space-y-5 divide-y divide-gray-100">
            {summary.doctor && (
              <div className="pt-5 first:pt-0">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Médecin
                </dt>
                <dd className="mt-1 text-gray-800">
                  Dr. {summary.doctor.firstName} {summary.doctor.lastName}
                  <span className="ml-2 text-sm text-gray-500">
                    — {summary.doctor.speciality}
                  </span>
                </dd>
              </div>
            )}

            {summary.reason && (
              <div className="pt-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Motif de consultation
                </dt>
                <dd className="mt-1 text-gray-800">{summary.reason}</dd>
              </div>
            )}

            <div className="pt-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Diagnostic
              </dt>
              <dd className="mt-1 text-gray-800 whitespace-pre-wrap">
                {summary.diagnosis ?? (
                  <span className="text-gray-400 italic">Non renseigné</span>
                )}
              </dd>
            </div>

            {summary.prescription && (
              <div className="pt-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Prescription
                </dt>
                <dd className="mt-1 text-gray-800 whitespace-pre-wrap">
                  {summary.prescription}
                </dd>
              </div>
            )}

            <div className="pt-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tarif
              </dt>
              <dd className="mt-1 font-medium text-gray-800">
                {summary.amount} MAD
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex gap-3">
            <button
              disabled
              className="flex-1 rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              title="Disponible en V2"
            >
              Télécharger le compte-rendu (PDF) — Bientôt disponible
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
