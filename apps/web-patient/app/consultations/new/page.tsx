"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/error-message";
import type { Consultation, ReferringDoctor } from "@medapp/shared-types";

export default function NewConsultationPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"standard" | "referring">("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: referringData } = useQuery<{ referringDoctor: ReferringDoctor | null }>({
    queryKey: ["referring-doctor"],
    queryFn: () => api.get("/patients/me/referring-doctor"),
    enabled: !!user,
  });

  const referringDoctor = referringData?.referringDoctor;

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body: { reason?: string; requestedDoctorId?: string } = {
        reason: reason.trim() || undefined,
      };
      if (mode === "referring" && referringDoctor) {
        body.requestedDoctorId = referringDoctor.id;
      }
      const consultation = await api.post<Consultation>("/consultations", body);
      router.push(`/payment/${consultation.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
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
            {/* Mode choice — only shown if patient has a referring doctor */}
            {referringDoctor && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Type de consultation
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("standard")}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${
                      mode === "standard"
                        ? "border-brand bg-brand/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      File générale
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Premier médecin disponible — attente plus courte
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("referring")}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${
                      mode === "referring"
                        ? "border-brand bg-brand/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      Mon médecin référent
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Dr. {referringDoctor.firstName} {referringDoctor.lastName}
                      {referringDoctor.speciality && ` · ${referringDoctor.speciality}`}
                    </p>
                  </button>
                </div>
                {mode === "referring" && (
                  <p className="mt-2 text-xs text-amber-600 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    Vous attendrez dans la file dédiée à votre médecin référent. Si non disponible sous 20 min, vous pourrez rejoindre la file générale.
                  </p>
                )}
              </div>
            )}

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
