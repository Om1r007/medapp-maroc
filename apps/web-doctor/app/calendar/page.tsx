"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Clock } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { WeeklyScheduleEditor } from "@/components/WeeklyScheduleEditor";
import { ExceptionsList } from "@/components/ExceptionsList";
import { AvailabilityOverrideCard } from "@/components/AvailabilityOverrideCard";
import type { DoctorProfile } from "@medapp/shared-types";

export default function CalendarPage() {
  const user = useRequireAuth();
  const router = useRouter();

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get<DoctorProfile>("/doctors/me"),
    enabled: !!user,
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (doctor?.status !== "VERIFIED") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-neutral-500">
            Le calendrier est accessible une fois votre compte vérifié.
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => router.push("/dashboard")}
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="mx-auto w-full max-w-3xl flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-neutral-900">
              Mon calendrier de disponibilité
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            Africa/Casablanca (UTC+1)
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <AvailabilityOverrideCard
          doctor={{
            isAvailable: doctor.isAvailable,
            manualOverride: doctor.manualOverride,
            manualOverrideUntil: doctor.manualOverrideUntil,
          }}
        />

        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <WeeklyScheduleEditor />
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <ExceptionsList />
        </div>
      </main>
    </div>
  );
}
