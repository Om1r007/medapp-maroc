"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Download, FileText, Pill, Stethoscope } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/navigation/BottomNav";
import type { ConsultationSummary } from "@medapp/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface InvoiceInfo {
  id: string;
  number: string;
  amountTtc: number;
  issuedAt: string;
  status: string;
}

async function downloadPdf(invoiceId: string, invoiceNumber: string) {
  const token = localStorage.getItem("patientAccessToken");
  const res = await fetch(`${API_URL}/api/invoices/${invoiceId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export default function ConsultationSummaryPage() {
  const user = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["summary", id],
    queryFn: () => api.get<ConsultationSummary>(`/consultations/${id}/summary`),
  });

  const { data: invoice } = useQuery({
    queryKey: ["invoice", "consultation", id],
    queryFn: () => api.get<InvoiceInfo | null>(`/invoices/consultation/${id}`),
    enabled: !!summary && summary.status === "COMPLETED",
    retry: false,
  });

  async function handleDownload() {
    if (!invoice) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadPdf(invoice.id, invoice.number);
    } catch {
      setDownloadError("Impossible de télécharger le reçu. Réessayez.");
    } finally {
      setDownloading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-6">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">Medapp</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6 space-y-4">
        {isLoading ? (
          <SummarySkeleton />
        ) : !summary ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-neutral-500">
            Compte-rendu introuvable.
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-primary-500 mb-4" />
              <h1 className="text-2xl font-semibold text-neutral-900">
                Consultation terminée
              </h1>
              {summary.doctor && (
                <p className="mt-2 text-neutral-500">
                  Avec Dr. {summary.doctor.firstName} {summary.doctor.lastName}
                  {summary.createdAt && (
                    <> · {new Date(summary.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}</>
                  )}
                </p>
              )}
              {summary.durationMinutes != null && (
                <p className="mt-1 text-xs text-neutral-400">
                  Durée : {summary.durationMinutes} min
                </p>
              )}
            </div>

            {/* Doctor */}
            {summary.doctor && (
              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50">
                    <Stethoscope className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">
                      Dr. {summary.doctor.firstName} {summary.doctor.lastName}
                    </p>
                    <p className="text-sm text-neutral-500">{summary.doctor.speciality}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Compte-rendu */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
              <p className="text-sm font-semibold text-neutral-900">
                Compte-rendu de votre consultation
              </p>

              {summary.reason && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Motif
                  </p>
                  <p className="text-neutral-800">{summary.reason}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="h-4 w-4 text-neutral-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Diagnostic
                  </p>
                </div>
                <p className="text-neutral-800 whitespace-pre-wrap">
                  {summary.diagnosis ?? (
                    <span className="text-neutral-400 italic">Non renseigné</span>
                  )}
                </p>
              </div>

              {summary.prescription && (
                <div className="border-t border-neutral-100 pt-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Pill className="h-4 w-4 text-primary-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Prescription
                    </p>
                  </div>
                  <p className="text-neutral-800 whitespace-pre-wrap">{summary.prescription}</p>
                </div>
              )}

              <div className="border-t border-neutral-100 pt-4 flex items-center justify-between">
                <span className="text-sm text-neutral-500">Tarif</span>
                <span className="font-semibold text-neutral-900">{summary.amount} MAD</span>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <p className="text-sm font-semibold text-neutral-900 mb-4">Vos documents</p>

              {invoice ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Reçu de paiement</p>
                        <p className="text-xs text-neutral-500">{invoice.number}</p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownload}
                      loading={downloading}
                    >
                      Télécharger
                    </Button>
                  </div>
                  {downloadError && (
                    <p className="text-xs text-error-700 text-center">{downloadError}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 text-center py-4">
                  Reçu en cours de génération…
                </p>
              )}
            </div>

            {/* Actions */}
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push("/dashboard")}
            >
              Retour au tableau de bord
            </Button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
