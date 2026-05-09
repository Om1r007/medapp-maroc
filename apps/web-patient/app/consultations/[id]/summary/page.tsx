"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
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

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Compte-rendu introuvable.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour au tableau de bord
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">
                Compte-rendu de consultation
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {summary.createdAt
                  ? new Date(summary.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
                {summary.durationMinutes !== null && (
                  <> · Durée : {summary.durationMinutes} min</>
                )}
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Terminée
            </span>
          </div>

          <dl className="mt-8 space-y-5 divide-y divide-gray-100">
            {summary.doctor && (
              <div className="pt-5 first:pt-0">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Médecin
                </dt>
                <dd className="mt-1 text-gray-800">
                  Dr. {summary.doctor.firstName} {summary.doctor.lastName}
                  <span className="ml-2 text-sm text-gray-500">
                    — {summary.doctor.speciality}
                  </span>
                </dd>
              </div>
            )}

            {summary.reason && (
              <div className="pt-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Motif de consultation
                </dt>
                <dd className="mt-1 text-gray-800">{summary.reason}</dd>
              </div>
            )}

            <div className="pt-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Diagnostic
              </dt>
              <dd className="mt-1 text-gray-800 whitespace-pre-wrap">
                {summary.diagnosis ?? (
                  <span className="text-gray-400 italic">Non renseigné</span>
                )}
              </dd>
            </div>

            {summary.prescription && (
              <div className="pt-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Prescription
                </dt>
                <dd className="mt-1 text-gray-800 whitespace-pre-wrap">
                  {summary.prescription}
                </dd>
              </div>
            )}

            <div className="pt-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tarif
              </dt>
              <dd className="mt-1 font-medium text-gray-800">
                {summary.amount} MAD
              </dd>
            </div>
          </dl>

          <div className="mt-8 space-y-2">
            {invoice ? (
              <>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60"
                >
                  {downloading ? "Téléchargement…" : `Télécharger le reçu ${invoice.number} (PDF)`}
                </button>
                {downloadError && (
                  <p className="text-center text-xs text-red-600">{downloadError}</p>
                )}
              </>
            ) : (
              <button
                disabled
                className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              >
                Reçu en cours de génération…
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
