"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/auth-store";
import { api } from "../../lib/api";
import type { DoctorProfile } from "@medapp/shared-types";

interface PendingConsultation {
  id: string;
  reason: string | null;
  status: string;
  amount: number;
  matchedAt?: string;
  patient: { firstName: string; lastName: string };
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", "me"],
    queryFn: () => api.get<DoctorProfile>("/doctors/me"),
    enabled: !!user,
  });

  const { data: pendingConsultation } = useQuery({
    queryKey: ["doctor", "pending-consultation"],
    queryFn: () => api.get<PendingConsultation | null>("/doctors/me/pending-consultation"),
    enabled: !!doctor?.isAvailable,
    refetchInterval: 3000,
  });

  const { mutate: setAvailability, isPending: isToggling } = useMutation({
    mutationFn: (isAvailable: boolean) =>
      api.patch<{ isAvailable: boolean; matchedConsultation?: PendingConsultation | null }>(
        "/doctors/me/availability",
        { isAvailable },
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["doctor", "me"],
        (prev: DoctorProfile) => ({ ...prev, isAvailable: data.isAvailable }),
      );
      if (data.matchedConsultation) {
        queryClient.setQueryData(
          ["doctor", "pending-consultation"],
          data.matchedConsultation,
        );
      }
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
                  🔔 Patient en attente
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

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Statut de disponibilité</h2>
              <p className="text-sm text-gray-600">
                {isVerified
                  ? "Activez pour recevoir des patients de la file d'attente"
                  : "Disponible une fois votre compte vérifié"}
              </p>
            </div>
            <button
              disabled={!isVerified || isToggling}
              onClick={() =>
                isVerified && doctor && setAvailability(!doctor.isAvailable)
              }
              className={`relative h-8 w-14 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
                doctor?.isAvailable ? "bg-brand" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
                  doctor?.isAvailable ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
          <p
            className={`mt-4 text-sm font-medium ${
              doctor?.isAvailable ? "text-green-700" : "text-gray-500"
            }`}
          >
            {doctor?.isAvailable
              ? "✓ Disponible — vous recevez les patients"
              : "Indisponible"}
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="Consultations aujourd'hui" value="0" />
          <Stat label="En attente dans la file" value="—" />
          <Stat label="Revenus du mois (MAD)" value="0" />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Prochaines fonctionnalités</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>• Salle de consultation vidéo (Daily.co)</li>
            <li>• Calendrier de disponibilité</li>
            <li>• Comptes-rendus & ordonnances</li>
            <li>• Facturation mensuelle</li>
          </ul>
        </section>

      </div>
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
