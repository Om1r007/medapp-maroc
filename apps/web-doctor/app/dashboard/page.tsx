"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import type { DoctorProfile, ComputedSlot } from "@medapp/shared-types";

interface PendingConsultation {
  id: string;
  reason: string | null;
  status: string;
  amount: number;
  matchedAt?: string;
  patient: { firstName: string; lastName: string };
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
  });

  const { data: pendingConsultation } = useQuery({
    queryKey: ["doctor", "pending-consultation"],
    queryFn: () => api.get<PendingConsultation | null>("/doctors/me/pending-consultation"),
    // Toujours actif pour un médecin vérifié : le match peut arriver à tout moment
    // (override, enqueue immédiat, scheduler). enabled:isAvailable créait un délai
    // entre le moment où le backend matche et le moment où le polling démarre.
    enabled: !!doctor && doctor.status === "VERIFIED",
    refetchInterval: 3000,
  });

  // Récupère la disponibilité calculée selon le calendrier (aujourd'hui)
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
      router.push(`/consultation/${consultationId}`);
    },
  });

  if (!user || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-gray-500">Chargement…</p>
      </div>
    );
  }

  const isVerified = doctor?.status === "VERIFIED";
  const isBusy = isOverriding || isClearing;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">
              {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : user.email}
            </h1>
            <p className="text-sm text-gray-600">
              {doctor?.speciality ?? "Tableau de bord praticien"}
            </p>
          </div>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </header>

        <StatusBanner status={doctor?.status} />

        {/* Pending consultation banner */}
        {pendingConsultation && (
          <section className="rounded-2xl border-2 border-brand bg-brand/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-brand-dark">
                  Patient en attente
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  <span className="font-medium">
                    {pendingConsultation.patient.firstName}{" "}
                    {pendingConsultation.patient.lastName}
                  </span>
                  {pendingConsultation.reason && (
                    <> — Motif : {pendingConsultation.reason}</>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tarif : {pendingConsultation.amount} MAD
                </p>
              </div>
              <button
                onClick={() => startConsultation(pendingConsultation.id)}
                disabled={isStarting}
                className="shrink-0 rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
              >
                {isStarting ? "Démarrage..." : "Démarrer la consultation"}
              </button>
            </div>
          </section>
        )}

        {/* Disponibilité avec override dropdown */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Statut de disponibilité</h2>

              <p className={`mt-1 text-sm font-medium ${doctor?.isAvailable ? "text-green-700" : "text-gray-500"}`}>
                {doctor?.isAvailable ? "Disponible — vous recevez les patients" : "Indisponible"}
              </p>

              {isVerified && isCalendarAvailableNow !== null && (
                <p className="mt-1 text-xs text-gray-400">
                  Selon votre calendrier, vous seriez{" "}
                  <span className={isCalendarAvailableNow ? "text-green-600 font-medium" : "text-gray-500 font-medium"}>
                    {isCalendarAvailableNow ? "disponible" : "indisponible"}
                  </span>{" "}
                  maintenant
                </p>
              )}
            </div>

            {isVerified && (
              <div className="relative">
                <button
                  disabled={isBusy}
                  onClick={() => setShowOverrideMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${doctor?.isAvailable ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  Override rapide
                  <span className="text-gray-400">▾</span>
                </button>

                {showOverrideMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg">
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
                        className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {isVerified && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <Link
                href="/calendar"
                className="text-sm text-brand hover:underline"
              >
                Modifier mon calendrier de disponibilité →
              </Link>
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="Consultations aujourd'hui" value="0" />
          <Stat label="En attente dans la file" value="—" />
          <Stat label="Revenus du mois (MAD)" value="0" />
        </section>

      </div>

      {/* Ferme le menu en cliquant ailleurs — z-40 sous le dropdown (z-50) */}
      {showOverrideMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOverrideMenu(false)}
        />
      )}
    </main>
  );
}

function StatusBanner({ status }: { status?: string }) {
  if (!status || status === "VERIFIED") return null;

  const config: Record<string, { bg: string; text: string; message: string }> = {
    PENDING: {
      bg: "bg-yellow-50 border-yellow-300",
      text: "text-yellow-800",
      message:
        "Votre compte est en cours de vérification. Vous pourrez accepter des patients une fois votre numéro d'Ordre confirmé.",
    },
    REJECTED: {
      bg: "bg-red-50 border-red-300",
      text: "text-red-800",
      message:
        "Votre dossier n'a pas pu être vérifié. Contactez le support pour régulariser votre situation.",
    },
    SUSPENDED: {
      bg: "bg-orange-50 border-orange-300",
      text: "text-orange-800",
      message:
        "Votre compte est suspendu. Contactez le support pour plus d'informations.",
    },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <div className={`rounded-xl border px-5 py-4 ${c.bg}`}>
      <p className={`text-sm font-medium ${c.text}`}>{c.message}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}
