"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { QueueStatus } from "@medapp/shared-types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QueuePage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: queueStatus } = useQuery({
    queryKey: ["queue-status", consultationId],
    queryFn: () =>
      api.get<QueueStatus>(`/consultations/${consultationId}/queue-status`),
    refetchInterval: 2000,
  });

  // Redirect on status change
  useEffect(() => {
    if (!queueStatus) return;
    if (queueStatus.status === "MATCHED" || queueStatus.status === "IN_PROGRESS") {
      router.push(`/consultation/${consultationId}`);
    }
    if (queueStatus.status === "REFUNDED") {
      setShowRefundModal(true);
    }
  }, [queueStatus?.status, consultationId, router]);

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: () => api.delete(`/consultations/${consultationId}`),
    onSuccess: () => router.push("/dashboard"),
    onError: (err) => {
      if (err instanceof ApiError) {
        const p = err.payload as { message?: string } | null;
        setCancelError(p?.message ?? "Erreur lors de l'annulation");
      }
    },
  });

  if (showRefundModal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <span className="text-2xl">⏱</span>
          </div>
          <h2 className="text-xl font-bold text-brand-dark">
            Aucun médecin disponible
          </h2>
          <p className="mt-3 text-gray-600">
            Le délai de 15 minutes est écoulé sans qu&apos;un médecin soit
            disponible. Vous allez être remboursé(e) intégralement.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand/90"
          >
            Retour au tableau de bord
          </button>
        </div>
      </main>
    );
  }

  const timeRemaining = queueStatus?.timeRemainingSeconds ?? 0;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <span className="text-blue-600 text-lg">⏳</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-dark">
                Vous êtes dans la file d&apos;attente
              </h1>
              <p className="text-sm text-gray-500">
                Un médecin vous sera assigné dès que possible
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-3xl font-bold text-blue-700">
                {queueStatus?.position ?? "—"}
              </p>
              <p className="mt-1 text-xs text-blue-600">Votre position</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-3xl font-bold text-gray-700">
                {queueStatus?.totalInQueue ?? "—"}
              </p>
              <p className="mt-1 text-xs text-gray-500">Patients en attente</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-3xl font-bold text-green-700">
                ~{queueStatus?.estimatedWaitMinutes ?? "—"}
              </p>
              <p className="mt-1 text-xs text-green-600">Min estimées</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Temps restant avant remboursement automatique</span>
              <span
                className={`font-mono font-bold text-base ${
                  timeRemaining < 120 ? "text-red-600" : "text-gray-800"
                }`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-brand transition-all"
                style={{
                  width: `${Math.min(100, (timeRemaining / ((queueStatus ? 15 : 15) * 60)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Vous pouvez fermer cette page — votre place est conservée.
          </p>

          {cancelError && (
            <p className="mt-3 text-sm text-red-600 text-center">{cancelError}</p>
          )}

          <button
            onClick={() => cancel()}
            disabled={isCancelling}
            className="mt-6 w-full rounded-lg border border-red-300 px-5 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isCancelling ? "Annulation..." : "Annuler et être remboursé(e)"}
          </button>
        </div>
      </div>
    </main>
  );
}
