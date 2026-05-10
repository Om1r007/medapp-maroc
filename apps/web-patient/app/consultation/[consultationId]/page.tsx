"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { VideoCall } from "@/components/VideoCall";
import { StarDisplay } from "@/components/doctor/StarRating";
import { QualityBadges } from "@/components/doctor/QualityBadges";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Consultation, VideoTokenResponse } from "@medapp/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface DoctorPublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  speciality: string;
  bio: string | null;
  yearsOfExperience: number | null;
  languages: string[];
  profilePhotoUrl: string | null;
  qualityScore: number | null;
  totalRatings: number;
  verifiedAt: string | null;
}

function WaitingCard({ doctorProfile }: { doctorProfile: DoctorPublicProfile | undefined }) {
  if (!doctorProfile) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <p className="font-medium text-neutral-900">En attente du médecin…</p>
        <p className="mt-1 text-sm text-neutral-500">
          La consultation démarrera dès que le médecin rejoindra.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4">
      <Avatar
        src={
          doctorProfile.profilePhotoUrl
            ? `${API_URL}${doctorProfile.profilePhotoUrl}`
            : null
        }
        firstName={doctorProfile.firstName}
        lastName={doctorProfile.lastName}
        size="xl"
        className="mx-auto"
      />

      <div>
        <h2 className="text-xl font-semibold text-neutral-900">
          Dr. {doctorProfile.firstName} {doctorProfile.lastName}
        </h2>
        <p className="text-sm text-neutral-500">
          {doctorProfile.speciality}
          {doctorProfile.yearsOfExperience
            ? ` · ${doctorProfile.yearsOfExperience} ans d'exp.`
            : ""}
        </p>
      </div>

      {doctorProfile.qualityScore !== null && (
        <div className="flex items-center justify-center gap-2">
          <StarDisplay score={doctorProfile.qualityScore} size={16} />
          <span className="text-xs text-neutral-500">
            ({doctorProfile.totalRatings} avis)
          </span>
        </div>
      )}

      {doctorProfile.languages.length > 0 && (
        <p className="text-xs text-neutral-500">
          {doctorProfile.languages.join(", ")}
        </p>
      )}

      <div className="pt-2">
        <div className="mx-auto h-6 w-6 rounded-full border-3 border-primary-500 border-t-transparent animate-spin" />
        <p className="mt-3 text-sm text-neutral-500">En attente du médecin…</p>
      </div>
    </div>
  );
}

export default function PatientConsultationPage() {
  const user = useRequireAuth();
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [redirected, setRedirected] = useState(false);

  const { data: consultation } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => api.get<Consultation>(`/consultations/${consultationId}`),
    refetchInterval: 3000,
  });

  const { data: videoToken } = useQuery({
    queryKey: ["video-token", consultationId],
    queryFn: () =>
      api.get<VideoTokenResponse>(`/consultations/${consultationId}/video-token`),
    enabled: !!consultation?.videoRoomUrl,
    staleTime: Infinity,
  });

  const { data: doctorProfile } = useQuery<DoctorPublicProfile>({
    queryKey: ["doctor-public", consultation?.doctorId],
    queryFn: () =>
      api.get<DoctorPublicProfile>(`/doctors/${consultation!.doctorId}/public-profile`),
    enabled: !!consultation?.doctorId,
    staleTime: Infinity,
  });

  const { data: badges } = useQuery<string[]>({
    queryKey: ["doctor-badges", consultation?.doctorId],
    queryFn: async (): Promise<string[]> => [],
    enabled: false,
  });

  useEffect(() => {
    if (
      (consultation?.status === "COMPLETED" || consultation?.status === "CANCELLED") &&
      !redirected
    ) {
      setRedirected(true);
      qc.invalidateQueries();
      if (consultation.status === "COMPLETED") {
        router.push(`/consultations/${consultationId}/rate`);
      } else {
        router.push(`/consultations/${consultationId}/summary`);
      }
    }
  }, [consultation?.status, consultationId, redirected, router, qc]);

  useEffect(() => {
    return () => {
      import("@daily-co/daily-js").then((mod) => {
        const existing = mod.default.getCallInstance();
        if (existing) existing.destroy().catch(() => {});
      }).catch(() => {});
    };
  }, []);

  if (!user) return null;

  if (!consultation?.videoRoomUrl || !videoToken) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <WaitingCard doctorProfile={doctorProfile} />
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-neutral-900">
      <header className="flex items-center justify-between bg-neutral-800 px-6 py-3 border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
          </div>
          <span className="text-sm text-neutral-300">Consultation en cours</span>
          {doctorProfile && (
            <span className="text-sm text-neutral-500">
              · Dr. {doctorProfile.firstName} {doctorProfile.lastName}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-neutral-600 px-4 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          Quitter
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
