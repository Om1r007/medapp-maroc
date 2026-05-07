"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { VideoCall } from "@/components/VideoCall";
import type { VideoTokenResponse, ConsultationSummary } from "@medapp/shared-types";

export default function DoctorConsultationPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const { data: videoToken, isLoading: tokenLoading } = useQuery({
    queryKey: ["video-token", consultationId],
    queryFn: () =>
      api.get<VideoTokenResponse>(`/consultations/${consultationId}/video-token`),
    staleTime: Infinity,
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", consultationId],
    queryFn: () =>
      api.get<ConsultationSummary>(`/consultations/${consultationId}/summary`),
    enabled: !!consultationId,
  });

  const { mutate: endConsultation, isPending: isEnding } = useMutation({
    mutationFn: () =>
      api.post(`/doctors/me/end-consultation/${consultationId}`, {
        diagnosis,
        prescription: prescription.trim() || undefined,
      }),
    onSuccess: () => router.push("/dashboard"),
    onError: (err) => {
      if (err instanceof ApiError) {
        const p = err.payload as { message?: string } | null;
        setEndError(p?.message ?? "Erreur lors de la clôture");
      }
      setShowConfirm(false);
    },
  });

  // Calc patient age from dateOfBirth if available
  const patient = summary?.patient;

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  if (!videoToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-white">Impossible de rejoindre la consultation.</p>
      </div>
    );
  }

  return (
    <main className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Video area */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center px-6 py-3 bg-gray-800">
          <p className="text-white font-medium">
            Consultation —{" "}
            {patient ? `${patient.firstName} ${patient.lastName}` : "Patient"}
          </p>
        </header>
        <div className="flex-1">
          <VideoCall
            roomUrl={videoToken.roomUrl}
            token={videoToken.token}
            userName={`Dr. ${summary?.doctor?.lastName ?? ""}`}
            onLeave={() => setShowConfirm(true)}
          />
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-80 bg-white flex flex-col border-l border-gray-200 overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Dossier patient</h2>
          {patient && (
            <p className="mt-1 text-sm text-gray-600">
              {patient.firstName} {patient.lastName}
            </p>
          )}
          {summary?.reason && (
            <p className="mt-2 text-sm">
              <span className="text-gray-500">Motif : </span>
              <span className="text-gray-800">{summary.reason}</span>
            </p>
          )}
        </div>

        <div className="flex-1 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Diagnostic <span className="text-red-500">*</span>
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Entrez votre diagnostic…"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
            <p className="mt-0.5 text-right text-xs text-gray-400">
              {diagnosis.length}/2000
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prescription{" "}
              <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Médicaments, posologie…"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
            <p className="mt-0.5 text-right text-xs text-gray-400">
              {prescription.length}/2000
            </p>
          </div>

          {endError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {endError}
            </p>
          )}
        </div>

        <div className="p-5 border-t border-gray-100">
          <button
            onClick={() => {
              if (!diagnosis.trim()) {
                setEndError("Le diagnostic est obligatoire.");
                return;
              }
              setEndError(null);
              setShowConfirm(true);
            }}
            className="w-full rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700"
          >
            Terminer la consultation
          </button>
        </div>
      </aside>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Terminer la consultation ?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Le diagnostic et la prescription seront enregistrés. Cette action
              est irréversible.
            </p>
            {!diagnosis.trim() && (
              <p className="mt-2 text-sm text-red-600">
                Le diagnostic est obligatoire.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isEnding}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => endConsultation()}
                disabled={isEnding || !diagnosis.trim()}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isEnding ? "Clôture…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
