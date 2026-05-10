"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Stethoscope,
  FileText,
  Pill,
  Clock,
  Download,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { BottomNav } from "@/components/navigation/BottomNav";
import type { ConsultationStatus } from "@medapp/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ConsultationDetail {
  id: string;
  status: ConsultationStatus;
  reason: string | null;
  diagnosis: string | null;
  prescription: string | null;
  amount: number;
  durationMinutes: number | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  excludedFromSharing: boolean;
  doctor: { firstName: string; lastName: string; speciality: string } | null;
}

interface InvoiceItem {
  id: string;
  number: string;
  amountTtc: number;
  currency: string;
}

async function downloadPdf(invoiceId: string, invoiceNumber: string) {
  const token = localStorage.getItem("patientAccessToken");
  const res = await fetch(`${API_URL}/api/invoices/${invoiceId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-neutral-700">{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useRequireAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const [excludeReason, setExcludeReason] = useState("");

  const { data: consultation, isLoading } = useQuery<ConsultationDetail>({
    queryKey: ["consultation-summary", id],
    queryFn: () => api.get<ConsultationDetail>(`/consultations/${id}/summary`),
    enabled: !!user,
  });

  const { data: invoice } = useQuery<InvoiceItem | null>({
    queryKey: ["invoice-consultation", id],
    queryFn: () =>
      api.get<InvoiceItem | null>(`/invoices/consultation/${id}`).catch(() => null),
    enabled: !!user && consultation?.status === "COMPLETED",
  });

  const excludeMutation = useMutation({
    mutationFn: () =>
      api.patch(`/consultations/${id}/exclude-from-sharing`, {
        reason: excludeReason.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultation-summary", id] });
      setShowExcludeModal(false);
      setExcludeReason("");
    },
  });

  const includeMutation = useMutation({
    mutationFn: () => api.patch(`/consultations/${id}/include-in-sharing`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consultation-summary", id] }),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="mx-auto w-full max-w-3xl flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="text-base font-semibold text-neutral-900">Détail consultation</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-6">
        {isLoading ? (
          <DetailSkeleton />
        ) : !consultation ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-neutral-500">
            Consultation introuvable.
          </div>
        ) : (
          <>
            {/* Header card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-neutral-500">
                    {new Date(consultation.createdAt).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {consultation.durationMinutes != null && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="h-3 w-3" />
                      Durée : {consultation.durationMinutes} min
                    </p>
                  )}
                </div>
                <StatusBadge status={consultation.status} />
              </div>

              {consultation.doctor && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50">
                    <Stethoscope className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">
                      Dr {consultation.doctor.firstName} {consultation.doctor.lastName}
                    </p>
                    <p className="text-xs text-neutral-500">{consultation.doctor.speciality}</p>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between pt-3 border-t border-neutral-100">
                <span className="text-sm text-neutral-500">Montant</span>
                <span className="font-semibold text-neutral-900">{consultation.amount} MAD</span>
              </div>
            </div>

            {/* Motif */}
            {consultation.reason && (
              <InfoCard
                icon={<FileText className="h-4 w-4 text-neutral-400" />}
                label="Motif de consultation"
              >
                <p className="text-sm text-neutral-700">{consultation.reason}</p>
              </InfoCard>
            )}

            {/* Compte-rendu */}
            {consultation.diagnosis && (
              <InfoCard
                icon={<FileText className="h-4 w-4 text-success-600" />}
                label="Compte-rendu médical"
              >
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                  {consultation.diagnosis}
                </p>
              </InfoCard>
            )}

            {/* Ordonnance */}
            {consultation.prescription && (
              <InfoCard
                icon={<Pill className="h-4 w-4 text-primary-500" />}
                label="Ordonnance"
              >
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                  {consultation.prescription}
                </p>
              </InfoCard>
            )}

            {/* Documents */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <p className="text-sm font-medium text-neutral-700 mb-3">Documents</p>

              {invoice ? (
                <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{invoice.number}</p>
                    <p className="text-xs text-neutral-500">
                      {invoice.amountTtc.toFixed(2)} {invoice.currency}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadPdf(invoice.id, invoice.number)}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Reçu PDF
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">Aucun document disponible.</p>
              )}

              {/* Prochain RDV — V2 */}
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <button
                  disabled
                  title="Bientôt disponible"
                  className="w-full rounded-lg border border-neutral-200 py-2.5 text-sm text-neutral-400 cursor-not-allowed"
                >
                  Reprendre rendez-vous avec ce médecin — Bientôt disponible
                </button>
              </div>

              {/* Sharing exclusion */}
              {consultation.status === "COMPLETED" && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  {consultation.excludedFromSharing ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <EyeOff className="h-3.5 w-3.5" />
                        Exclue du partage avec d&apos;autres médecins
                      </div>
                      <button
                        onClick={() => includeMutation.mutate()}
                        disabled={includeMutation.isPending}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Réintégrer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowExcludeModal(true)}
                      className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Exclure du partage avec d&apos;autres médecins
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Exclusion modal */}
      <Modal
        open={showExcludeModal}
        onOpenChange={(open) => {
          if (!open) { setShowExcludeModal(false); setExcludeReason(""); }
        }}
        title="Exclure du partage ?"
        description="Cette consultation contient des informations importantes pour vos futurs soins. En l'excluant, les futurs médecins Medapp ne pourront pas y accéder."
      >
        <div className="mt-4">
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Raison de l&apos;exclusion (optionnel)
          </label>
          <textarea
            value={excludeReason}
            onChange={(e) => setExcludeReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="ex: Consultation psychologique privée…"
            className={cn(
              "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none resize-none",
              "focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors",
            )}
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => { setShowExcludeModal(false); setExcludeReason(""); }}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => excludeMutation.mutate()}
            loading={excludeMutation.isPending}
          >
            Confirmer l&apos;exclusion
          </Button>
        </ModalFooter>
      </Modal>

      <BottomNav />
    </div>
  );
}
