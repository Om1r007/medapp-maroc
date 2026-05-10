"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, TrendingUp, TrendingDown, Award, LogOut, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { DoctorProfile, ComputedSlot } from "@medapp/shared-types";

interface PendingConsultation {
  id: string;
  reason: string | null;
  status: string;
  amount: number;
  matchedAt?: string;
  isUrgent: boolean;
  preConsultData: { mainSymptom: string; painLevel: number | null } | null;
  patient: { firstName: string; lastName: string; age: number };
}

const OVERRIDE_OPTIONS = [
  { label: "Disponible 30 min", isAvailable: true, durationMinutes: 30 },
  { label: "Disponible 1h", isAvailable: true, durationMinutes: 60 },
  { label: "Disponible jusqu'à désactivation", isAvailable: true, durationMinutes: undefined },
  { label: "Indisponible 1h", isAvailable: false, durationMinutes: 60 },
  { label: "Suivre mon calendrier", isAvailable: null, durationMinutes: undefined },
] as const;

export default function DoctorDashboardPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get<DoctorProfile>("/doctors/me"),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: pendingConsultation } = useQuery({
    queryKey: ["doctor", "pending-consultation"],
    queryFn: () => api.get<PendingConsultation | null>("/doctors/me/pending-consultation"),
    enabled: !!doctor && doctor.status === "VERIFIED",
    refetchInterval: 3000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: computedSlots } = useQuery({
    queryKey: ["availability", "computed", todayStr],
    queryFn: () => api.get<ComputedSlot[]>(`/availability/computed?date=${todayStr}`),
    enabled: !!doctor && doctor.status === "VERIFIED",
  });

  const isCalendarAvailableNow = (() => {
    if (!computedSlots) return null;
    const now = new Date();
    return computedSlots.some(
      (s) => new Date(s.startsAt) <= now && new Date(s.endsAt) > now,
    );
  })();

  const { mutate: setOverride, isPending: isOverriding } = useMutation({
    mutationFn: (opts: { isAvailable: boolean; durationMinutes?: number }) =>
      api.post("/availability/override", opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "me"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", "pending-consultation"] });
      setShowOverrideMenu(false);
    },
  });

  const { mutate: clearOverride, isPending: isClearing } = useMutation({
    mutationFn: () => api.delete("/availability/override"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "me"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", "pending-consultation"] });
      setShowOverrideMenu(false);
    },
  });

  const { mutate: startConsultation, isPending: isStarting } = useMutation({
    mutationFn: (consultationId: string) =>
      api.post(`/doctors/me/start-consultation/${consultationId}`, {}),
    onSuccess: (_data, consultationId) => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "pending-consultation"] });
      router.push(`/consultation/${consultationId}`);
    },
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const isVerified = doctor?.status === "VERIFIED";
  const isBusy = isOverriding || isClearing;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* TopBar */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="mx-auto w-full max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-900 text-sm">
                {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Tableau de bord"}
              </span>
              {doctor?.speciality && (
                <span className="ml-2 text-xs text-neutral-400">{doctor.speciality}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-6">
        {/* Status banner for unverified accounts */}
        <StatusBanner status={doctor?.status} />

        {/* Pending consultation */}
        {pendingConsultation && (
          <section
            className={cn(
              "border-2 rounded-xl p-6",
              pendingConsultation.isUrgent
                ? "border-error-500 bg-error-50"
                : "border-primary-500 bg-primary-50",
            )}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full animate-pulse",
                      pendingConsultation.isUrgent ? "bg-error-500" : "bg-primary-500",
                    )}
                  />
                  <p
                    className={cn(
                      "text-sm font-semibold uppercase tracking-wider",
                      pendingConsultation.isUrgent ? "text-error-700" : "text-primary-700",
                    )}
                  >
                    {pendingConsultation.isUrgent ? "Patient urgent" : "Patient en attente"}
                  </p>
                </div>
                <p className="text-lg font-semibold text-neutral-900">
                  {pendingConsultation.patient.firstName}{" "}
                  {pendingConsultation.patient.lastName}
                  {pendingConsultation.patient.age > 0 && (
                    <span className="ml-1.5 text-base font-normal text-neutral-500">
                      {pendingConsultation.patient.age} ans
                    </span>
                  )}
                </p>
                {pendingConsultation.reason && (
                  <p className="text-sm text-neutral-600 mt-0.5">{pendingConsultation.reason}</p>
                )}

                {pendingConsultation.preConsultData && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white border border-neutral-200 px-2.5 py-0.5 text-xs text-neutral-700">
                      {pendingConsultation.preConsultData.mainSymptom}
                    </span>
                    {pendingConsultation.preConsultData.painLevel !== null && (
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          pendingConsultation.preConsultData.painLevel >= 7
                            ? "border-error-200 bg-error-50 text-error-700"
                            : "border-neutral-200 bg-white text-neutral-700",
                        )}
                      >
                        Douleur {pendingConsultation.preConsultData.painLevel}/10
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={() => startConsultation(pendingConsultation.id)}
                loading={isStarting}
                variant={pendingConsultation.isUrgent ? "destructive" : "primary"}
                size="lg"
                className="flex-shrink-0"
              >
                Démarrer
              </Button>
            </div>
          </section>
        )}

        {/* Availability */}
        {isVerified && (
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <SectionTitle title="Disponibilité" />
                <div className="flex items-center gap-3">
                  <Switch
                    checked={doctor?.isAvailable ?? false}
                    disabled={isBusy}
                    onCheckedChange={(checked) => {
                      setOverride({ isAvailable: checked });
                    }}
                    size="md"
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      doctor?.isAvailable ? "text-success-700" : "text-neutral-500",
                    )}
                  >
                    {doctor?.isAvailable
                      ? "Disponible — vous recevez les patients"
                      : "Indisponible"}
                  </span>
                </div>

                {isCalendarAvailableNow !== null && (
                  <p className="mt-2 text-xs text-neutral-400">
                    Calendrier :{" "}
                    <span
                      className={
                        isCalendarAvailableNow
                          ? "text-success-600 font-medium"
                          : "text-neutral-500 font-medium"
                      }
                    >
                      {isCalendarAvailableNow ? "disponible" : "indisponible"}
                    </span>{" "}
                    maintenant
                  </p>
                )}
              </div>

              <div className="relative">
                <button
                  disabled={isBusy}
                  onClick={() => setShowOverrideMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  Override rapide
                  <span className="text-neutral-400 text-xs">▾</span>
                </button>

                {showOverrideMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
                    {OVERRIDE_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          if (opt.isAvailable === null) {
                            clearOverride();
                          } else {
                            setOverride({
                              isAvailable: opt.isAvailable,
                              durationMinutes: opt.durationMinutes,
                            });
                          }
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-neutral-100 pt-4 flex gap-6">
              <Link href="/calendar" className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
                Calendrier →
              </Link>
              <Link href="/invoices" className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
                Mes factures →
              </Link>
            </div>
          </section>
        )}

        {/* KPIs */}
        <section>
          <SectionTitle title="Aujourd'hui" />
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Consultations" value="0" subLabel="aujourd'hui" />
            <KpiCard label="Revenus" value="0 MAD" subLabel="ce mois" />
            {isVerified && <ReferringPatientsKpi />}
          </div>
        </section>

        {/* Quality */}
        {isVerified && <QualitySection />}
      </main>

      {/* Close overlay for dropdown */}
      {showOverrideMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOverrideMenu(false)}
        />
      )}
    </div>
  );
}

function StatusBanner({ status }: { status?: string }) {
  if (!status || status === "VERIFIED") return null;

  const config: Record<string, { variant: string; message: string }> = {
    PENDING: {
      variant: "warning",
      message:
        "Votre compte est en cours de vérification. Vous pourrez accepter des patients une fois votre numéro d'Ordre confirmé.",
    },
    REJECTED: {
      variant: "error",
      message:
        "Votre dossier n'a pas pu être vérifié. Contactez le support pour régulariser votre situation.",
    },
    SUSPENDED: {
      variant: "warning",
      message: "Votre compte est suspendu. Contactez le support pour plus d'informations.",
    },
  };

  const c = config[status];
  if (!c) return null;

  const isError = c.variant === "error";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-5 py-4",
        isError
          ? "bg-error-50 border-error-200"
          : "bg-warning-50 border-warning-200",
      )}
    >
      <AlertCircle
        className={cn(
          "h-4 w-4 flex-shrink-0 mt-0.5",
          isError ? "text-error-600" : "text-warning-600",
        )}
      />
      <p
        className={cn(
          "text-sm",
          isError ? "text-error-700" : "text-warning-700",
        )}
      >
        {c.message}
      </p>
    </div>
  );
}

function ReferringPatientsKpi() {
  const { data } = useQuery({
    queryKey: ["doctor", "referring-patients-count"],
    queryFn: () => api.get<{ count: number }>("/doctors/me/referring-patients-count"),
    refetchInterval: 60_000,
  });

  return (
    <KpiCard
      label="Patients référents"
      value={data?.count ?? "—"}
      subLabel="vous ont désigné"
    />
  );
}

function QualitySection() {
  const { data: stats } = useQuery({
    queryKey: ["doctor", "quality-stats"],
    queryFn: () =>
      api.get<{ qualityScore: number | null; totalRatings: number; trend: number | null }>(
        "/doctors/me/quality-stats",
      ),
    refetchInterval: 60_000,
  });

  return (
    <section className="bg-white border border-neutral-200 rounded-xl p-6">
      <SectionTitle
        title="Mon profil qualité"
        action={{ label: "Voir mes avis", href: "/feedback" }}
      />

      <div className="flex items-start gap-8">
        {/* Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 fill-warning-500 text-warning-500" />
            <span className="text-3xl font-bold text-neutral-900 tracking-tight">
              {stats?.qualityScore != null ? stats.qualityScore.toFixed(1) : "—"}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {stats?.totalRatings ?? 0} avis (90 jours)
          </p>
          {stats?.trend !== null && stats?.trend !== undefined && (
            <div
              className={cn(
                "mt-1 flex items-center gap-0.5 text-xs font-medium",
                stats.trend >= 0 ? "text-success-700" : "text-error-600",
              )}
            >
              {stats.trend >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {stats.trend >= 0 ? "+" : ""}
              {stats.trend.toFixed(1)} vs mois dernier
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          {stats?.qualityScore == null && (
            <p className="text-sm text-neutral-400">
              Votre score sera affiché après 5 consultations notées.
            </p>
          )}
          {stats?.qualityScore != null && stats.qualityScore < 4.0 && (
            <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 p-3">
              <AlertCircle className="h-4 w-4 text-error-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-error-700">
                Votre score est en dessous du standard qualité (4.0/5).
                Un score inférieur à 4.0 sur 20+ avis peut entraîner une suspension.
              </p>
            </div>
          )}
          {stats?.qualityScore != null && stats.qualityScore >= 4.0 && (
            <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 p-3">
              <Award className="h-4 w-4 text-success-600 flex-shrink-0" />
              <p className="text-xs text-success-700">
                Vous maintenez le standard qualité Medapp.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 border-t border-neutral-100 pt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Calendrier", href: "/calendar" },
          { label: "Statistiques", href: "/feedback" },
          { label: "Factures", href: "/invoices" },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center rounded-lg border border-neutral-200 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
