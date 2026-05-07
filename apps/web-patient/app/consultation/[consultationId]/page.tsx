"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VideoCall } from "@/components/VideoCall";
import type { Consultation, VideoTokenResponse } from "@medapp/shared-types";

export default function PatientConsultationPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const [showEndModal, setShowEndModal] = useState(false);

  // Poll consultation until videoRoomUrl is available, then keep polling for COMPLETED
  const { data: consultation } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => api.get<Consultation>(`/consultations/${consultationId}`),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      if (data.status === "COMPLETED" || data.status === "CANCELLED") return false;
      return 3000;
    },
  });

  // Fetch video token once room URL is ready
  const { data: videoToken } = useQuery({
    queryKey: ["video-token", consultationId],
    queryFn: () =>
      api.get<VideoTokenResponse>(`/consultations/${consultationId}/video-token`),
    enabled: !!consultation?.videoRoomUrl,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (consultation?.status === "COMPLETED") {
      setShowEndModal(true);
    }
  }, [consultation?.status]);

  if (showEndModal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-brand-dark">
            Consultation terminée
          </h2>
          <p className="mt-2 text-gray-600">
            Merci ! Votre compte-rendu médical est disponible.
          </p>
          <button
            onClick={() => router.push(`/consultations/${consultationId}/summary`)}
            className="mt-6 w-full rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand/90"
          >
            Voir le compte-rendu
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-3 w-full rounded-lg border border-gray-300 px-6 py-2 text-sm hover:bg-gray-50"
          >
            Retour au tableau de bord
          </button>
        </div>
      </main>
    );
  }

  // Waiting for video room
  if (!consultation?.videoRoomUrl || !videoToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-gray-600 font-medium">
            En attente du médecin…
          </p>
          <p className="mt-1 text-sm text-gray-400">
            La consultation démarrera dès que le médecin rejoindra.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-gray-900">
      <header className="flex items-center justify-between bg-gray-800 px-6 py-3">
        <p className="text-white font-medium">Consultation en cours</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-gray-600 px-4 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
        >
          Quitter le call
        </button>
      </header>

      <div className="flex-1">
        <VideoCall
          roomUrl={videoToken.roomUrl}
          token={videoToken.token}
          userName={consultation.patientId}
          onLeave={() => router.push("/dashboard")}
        />
      </div>
    </main>
  );
}
