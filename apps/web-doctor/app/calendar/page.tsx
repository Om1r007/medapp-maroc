"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../lib/auth-store";
import { api } from "../../lib/api";
import { WeeklyScheduleEditor } from "../../components/WeeklyScheduleEditor";
import { ExceptionsList } from "../../components/ExceptionsList";
import { AvailabilityOverrideCard } from "../../components/AvailabilityOverrideCard";
import type { DoctorProfile } from "@medapp/shared-types";

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get<DoctorProfile>("/doctors/me"),
    enabled: !!user,
  });

  if (!user || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-gray-500">Chargement…</p>
      </div>
    );
  }

  if (doctor?.status !== "VERIFIED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <p className="text-gray-500">
            Le calendrier est accessible une fois votre compte vérifié.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-sm text-brand hover:underline"
          >
            ← Retour au tableau de bord
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-1 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Tableau de bord
            </button>
            <h1 className="text-2xl font-bold text-brand-dark">
              Mon calendrier de disponibilité
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Fuseau horaire : Africa/Casablanca (UTC+1)
            </p>
          </div>
        </div>

        <AvailabilityOverrideCard
          doctor={{
            isAvailable: doctor.isAvailable,
            manualOverride: doctor.manualOverride,
            manualOverrideUntil: doctor.manualOverrideUntil,
          }}
        />

        <WeeklyScheduleEditor />

        <ExceptionsList />

      </div>
    </main>
  );
}
