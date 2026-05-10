"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { extractErrorMessage } from "@/lib/error-message";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { VideoCall } from "@/components/VideoCall";
import { PatientFilePanel } from "@/components/consultation/PatientFilePanel";
import { PreConsultBrief } from "@/components/consultation/PreConsultBrief";
import type { VideoTokenResponse, ConsultationSummary } from "@medapp/shared-types";

export default function DoctorConsultationPage() {
  const user = useRequireAuth();
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

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
    refetchInterval: 3000,
  });

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-redirect on completion
  useEffect(() => {
    if (summary?.status === "COMPLETED") {
      qc.invalidateQueries();
      router.push("/dashboard");
    }
  }, [summary?.status, router, qc]);

  useEffect(() => {
    return () => {
      import("@daily-co/daily-js").then((mod) => {
        const existing = mod.default.getCallInstance();
        if (existing) existing.destroy().catch(() => {});
      }).catch(() => {});
    };
  }, []);

  const { mutate: endConsultation, isPending: isEnding } = useMutation({
    mutationFn: () =>
      api.post(`/doctors/me/end-consultation/${consultationId}`, {
        diagnosis,
        prescription: prescription.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor"] });
      qc.invalidateQueries({ queryKey: ["consultation"] });
      qc.invalidateQueries({ queryKey: ["consultations"] });
      router.push("/dashboard");
    },
    onError: (err) => {
      setEndError(extractErrorMessage(err, "Erreur lors de la clôture"));
      setShowConfirm(false);
    },
  });

  const patient = summary?.patient;

  const timerStr = (() => {
    const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  })();

  if (!user) return null;

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900">
        <div className="h-10 w-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!videoToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-6">
        <p className="text-white">Impossible de rejoindre la consultation.</p>
      </div>
    );
  }

  return (
    <main className="flex h-screen bg-neutral-900 overflow-hidden">
      {/* Video area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-3 bg-neutral-800 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <p className="text-sm text-neutral-200 font-medium">
              {patient ? `${patient.firstName} ${patient.lastName}` : "Consultation en cours"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-neutral-400">{timerStr}</span>
            <span className="text-xs text-warning-500 hidden md:block">
              Clôture automatique 1h après démarrage
            </span>
          </div>
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

      {/* Patient file panel */}
      <PatientFilePanel consultationId={consultationId} />

      {/* Notes sidebar */}
      <aside className="w-80 bg-white flex flex-col border-l border-neutral-200 overflow-y-auto flex-shrink-0">
        <div className="p-5 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900 text-sm">Dossier patient</h2>
          {patient && (
            <p className="mt-0.5 text-sm text-neutral-600">
              {patient.firstName} {patient.lastName}
            </p>
          )}
          {summary?.reason && (
            <p className="mt-2 text-xs">
              <span className="text-neutral-400">Motif : </span>
              <span className="text-neutral-700">{summary.reason}</span>
            </p>
          )}
        </div>

        <div className="flex-1 p-5 space-y-4">
          <PreConsultBrief consultationId={consultationId} />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Diagnostic <span className="text-error-500">*</span>
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Entrez votre diagnostic…"
              className={cn(
                "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-none",
                "focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors",
              )}
            />
            <p className="mt-0.5 text-right text-xs text-neutral-400">
              {diagnosis.length}/2000
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Prescription{" "}
              <span className="text-xs text-neutral-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Médicaments, posologie…"
              className={cn(
                "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-none",
                "focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors",
              )}
            />
            <p className="mt-0.5 text-right text-xs text-neutral-400">
              {prescription.length}/2000
            </p>
          </div>

          {endError && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600">
              {endError}
            </p>
          )}
        </div>

        <div className="p-5 border-t border-neutral-100">
          <Button
            variant="destructive"
            fullWidth
            onClick={() => {
              if (!diagnosis.trim()) {
                setEndError("Le diagnostic est obligatoire.");
                return;
              }
              setEndError(null);
              setShowConfirm(true);
            }}
          >
            Terminer la consultation
          </Button>
        </div>
      </aside>

      {/* Confirmation modal */}
      <Modal
        open={showConfirm}
        onOpenChange={(open) => {
          if (!open && !isEnding) setShowConfirm(false);
        }}
        title="Terminer la consultation ?"
        description="Le diagnostic et la prescription seront enregistrés. Cette action est irréversible."
      >
        {!diagnosis.trim() && (
          <p className="mt-2 text-sm text-error-600">
            Le diagnostic est obligatoire.
          </p>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowConfirm(false)}
            disabled={isEnding}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => endConsultation()}
            loading={isEnding}
            disabled={!diagnosis.trim()}
          >
            Confirmer
          </Button>
        </ModalFooter>
      </Modal>
    </main>
  );
}
