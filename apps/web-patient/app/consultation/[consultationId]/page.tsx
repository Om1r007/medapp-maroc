"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { VideoCall } from "@/components/VideoCall";
import type { Consultation, VideoTokenResponse } from "@medapp/shared-types";

export default function PatientConsultationPage() {
  const user = useRequireAuth();
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [redirected, setRedirected] = useState(false);

  // Poll consultation status every 3s
  const { data: consultation } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => api.get<Consultation>(`/consultations/${consultationId}`),
    refetchInterval: 3000,
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
    if (
      (consultation?.status === "COMPLETED" || consultation?.status === "CANCELLED") &&
      !redirected
    ) {
      setRedirected(true);
      qc.invalidateQueries();
      router.push(`/consultations/${consultationId}/summary`);
    }
  }, [consultation?.status, consultationId, redirected, router, qc]);

  // Destroy any lingering Daily instance when leaving the page
  useEffect(() => {
    return () => {
      import("@daily-co/daily-js").then((mod) => {
        const existing = mod.default.getCallInstance();
        if (existing) existing.destroy().catch(() => {});
      }).catch(() => {});
    };
  }, []);

  if (!user) return null;

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
