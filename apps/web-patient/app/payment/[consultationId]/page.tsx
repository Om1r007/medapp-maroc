"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/error-message";
import type { Consultation } from "@medapp/shared-types";

export default function PaymentPage() {
  const user = useRequireAuth();
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState<"success" | "failure" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => api.get<Consultation>(`/consultations/${consultationId}`),
  });

  if (!user) return null;

  async function handleSimulate(type: "success" | "failure") {
    setLoading(type);
    setError(null);

    try {
      await api.post(`/payments/${consultationId}/simulate-${type}`, {});
      if (type === "success") {
        router.push(`/queue/${consultationId}`);
      } else {
        setError("Paiement refusé. Vérifiez vos informations et réessayez.");
        setLoading(null);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
      setLoading(null);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chargement...</p>
      </main>
    );
  }

  if (!consultation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500">Consultation introuvable.</p>
      </main>
    );
  }

  if (consultation.paymentStatus === "SUCCEEDED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-green-600 font-medium">Paiement déjà effectué.</p>
          <button
            onClick={() => router.push(`/queue/${consultationId}`)}
            className="mt-4 rounded-lg bg-brand px-5 py-2 text-sm text-white"
          >
            Voir la file d&apos;attente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour au tableau de bord
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-brand-dark">Paiement</h1>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Consultation</span>
              <span className="font-mono text-xs text-gray-400 truncate ml-4">
                #{consultation.id}
              </span>
            </div>
            {consultation.reason && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Motif</span>
                <span className="text-gray-800 ml-4 text-right max-w-xs">
                  {consultation.reason}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
              <span className="font-medium text-gray-700">Montant</span>
              <span className="font-bold text-brand-dark text-base">
                {consultation.amount} MAD
              </span>
            </div>
          </div>

          {consultation.paymentStatus === "FAILED" && !error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Le dernier paiement a échoué. Veuillez réessayer.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-700">
            Mode développement — simulation du paiement
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => handleSimulate("success")}
              disabled={loading !== null}
              className="w-full rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading === "success" ? "Traitement..." : "🟢 Simuler paiement réussi"}
            </button>
            <button
              onClick={() => handleSimulate("failure")}
              disabled={loading !== null}
              className="w-full rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading === "failure" ? "Traitement..." : "🔴 Simuler paiement échoué"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
