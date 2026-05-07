"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api";
import type { Consultation } from "@medapp/shared-types";

export default function NewConsultationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    router.push("/login");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const consultation = await api.post<Consultation>("/consultations", {
        reason: reason.trim() || undefined,
      });
      router.push(`/payment/${consultation.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const payload = err.payload as { message?: string } | null;
        setError(payload?.message ?? "Une erreur est survenue");
      } else {
        setError("Une erreur est survenue");
      }
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-brand-dark">
            Nouvelle consultation
          </h1>
          <p className="mt-1 text-gray-500">
            Un médecin vous prendra en charge dès que possible.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                Motif de consultation{" "}
                <span className="font-normal text-gray-400">(optionnel)</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Décrivez brièvement vos symptômes ou votre raison de consulter..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {reason.length}/500
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tarif de consultation</span>
                <span className="text-lg font-bold text-brand-dark">150 MAD</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Paiement sécurisé — remboursement automatique si aucun médecin
                disponible sous 15 min.
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {loading ? "Création en cours..." : "Procéder au paiement"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
