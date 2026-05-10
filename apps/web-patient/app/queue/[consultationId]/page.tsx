"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/error-message";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { QueueStatus } from "@medapp/shared-types";

const TIPS = [
  "Trouvez un endroit calme et bien éclairé.",
  "Vérifiez que votre micro et caméra fonctionnent.",
  "Préparez vos questions pour le médecin.",
  "Notez vos symptômes et depuis quand ils durent.",
  "Ayez votre carte CIN à portée en cas de besoin.",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PulsingDots() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-3 w-3 rounded-full bg-primary-500 animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
}

export default function QueuePage() {
  const user = useRequireAuth();
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackDone, setFallbackDone] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const { data: queueStatus } = useQuery({
    queryKey: ["queue-status", consultationId],
    queryFn: () =>
      api.get<QueueStatus>(`/consultations/${consultationId}/queue-status`),
    refetchInterval: 2000,
  });

  // Rotate tips every 30 sec
  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!queueStatus) return;
    if (queueStatus.status === "MATCHED" || queueStatus.status === "IN_PROGRESS") {
      router.push(`/consultation/${consultationId}`);
    }
    if (queueStatus.status === "REFUNDED") {
      setShowRefundModal(true);
    }
  }, [queueStatus?.status, consultationId, router]);

  useEffect(() => {
    if (
      !fallbackDone &&
      queueStatus?.isReferringRequest &&
      queueStatus.referringWaitedMinutes >= 20
    ) {
      setShowFallbackModal(true);
    }
  }, [queueStatus?.referringWaitedMinutes, queueStatus?.isReferringRequest, fallbackDone]);

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: () => api.delete(`/consultations/${consultationId}`),
    onSuccess: () => router.push("/dashboard"),
    onError: (err) => {
      setCancelError(extractErrorMessage(err, "Erreur lors de l'annulation"));
    },
  });

  const { mutate: fallback, isPending: isFallbacking } = useMutation({
    mutationFn: () =>
      api.post(`/consultations/${consultationId}/fallback-to-global`, {}),
    onSuccess: () => {
      setShowFallbackModal(false);
      setFallbackDone(true);
    },
  });

  if (!user) return null;

  const timeRemaining = queueStatus?.timeRemainingSeconds ?? 900;
  const progressPct = Math.max(0, Math.min(100, (timeRemaining / (15 * 60)) * 100));

  if (showRefundModal) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="mx-auto max-w-md bg-white border border-neutral-200 rounded-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-50">
            <span className="text-2xl">⏱</span>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Aucun médecin disponible</h2>
          <p className="mt-3 text-sm text-neutral-600">
            Le délai de 15 minutes est écoulé. Vous allez être remboursé(e) intégralement.
          </p>
          <Button fullWidth className="mt-6" onClick={() => router.push("/dashboard")}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">Medapp</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-6 space-y-4">
        {/* Main status card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <PulsingDots />
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900">
            {queueStatus?.isReferringRequest && queueStatus.requestedDoctorName
              ? `En attente de ${queueStatus.requestedDoctorName}`
              : "Recherche en cours"}
          </h1>
          <p className="mt-2 text-neutral-500">
            Un médecin vous sera assigné dès que possible
          </p>

          {/* Referring badge */}
          {queueStatus?.isReferringRequest && (
            <div className="mt-4 inline-flex items-center gap-1.5 bg-primary-50 border border-primary-200 rounded-full px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              <span className="text-xs font-medium text-primary-700">File référent — prioritaire</span>
            </div>
          )}

          {/* Position stats */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { value: queueStatus?.position ?? "—", label: "Votre position" },
              { value: queueStatus?.totalInQueue ?? "—", label: "En attente" },
              { value: `~${queueStatus?.estimatedWaitMinutes ?? "—"}`, label: "Min estimées" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-neutral-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-neutral-900">{value}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Time remaining */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
              <span>Remboursement automatique dans</span>
              <span
                className={cn(
                  "font-mono font-bold text-sm",
                  timeRemaining < 120 ? "text-error-600" : "text-neutral-800",
                )}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-200">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-1000",
                  timeRemaining < 120 ? "bg-error-500" : "bg-primary-500",
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-neutral-400">
            Vous pouvez fermer cette page — votre place est conservée.
          </p>
        </div>

        {/* Trust signals */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Nos engagements
          </p>
          <ul className="space-y-2">
            {[
              "Tous nos médecins sont diplômés et vérifiés par notre équipe",
              "Membres de l'Ordre National des Médecins du Maroc",
              "Score moyen 4.7/5 sur toutes les consultations",
              "+12 000 consultations réalisées",
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-700">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rotating tips */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Pendant que vous attendez
          </p>
          <p className="text-sm text-neutral-700 transition-all duration-300">
            {TIPS[tipIndex]}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            {TIPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === tipIndex ? "w-4 bg-primary-500" : "w-1.5 bg-neutral-200",
                )}
              />
            ))}
          </div>
        </div>

        {/* Cancel */}
        {cancelError && (
          <p className="text-sm text-error-700 text-center">{cancelError}</p>
        )}
        <Button
          variant="ghost"
          fullWidth
          onClick={() => cancel()}
          disabled={isCancelling}
          className="text-neutral-500 border border-neutral-200"
        >
          {isCancelling ? "Annulation..." : "Annuler et être remboursé(e)"}
        </Button>
      </main>

      {/* Fallback modal */}
      <Modal
        open={showFallbackModal}
        onOpenChange={(open) => {
          if (!open) setShowFallbackModal(false);
        }}
        title="Attente prolongée"
        description={`Votre médecin référent n'est pas encore disponible après 20 minutes. Voulez-vous rejoindre la file générale pour être pris(e) en charge rapidement ?`}
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowFallbackModal(false)}>
            Continuer d&apos;attendre
          </Button>
          <Button onClick={() => fallback()} loading={isFallbacking}>
            File générale
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
