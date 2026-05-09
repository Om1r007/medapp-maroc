"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface InvoiceItem {
  id: string;
  number: string;
  type: string;
  status: "ISSUED" | "PAID" | "CANCELLED";
  issuedAt: string;
  amountTtc: number;
  periodStart: string | null;
  periodEnd: string | null;
  currency: string;
}

const STATUS_LABELS: Record<InvoiceItem["status"], string> = {
  ISSUED: "Émise",
  PAID: "Payée",
  CANCELLED: "Annulée",
};

const STATUS_COLORS: Record<InvoiceItem["status"], string> = {
  ISSUED: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

async function downloadPdf(invoiceId: string, invoiceNumber: string) {
  const token = localStorage.getItem("doctorAccessToken");
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

function formatPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  return new Date(start).toLocaleDateString("fr-FR", opts);
}

export default function DoctorInvoicesPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["invoices", "me"],
    queryFn: () => api.get<{ items: InvoiceItem[]; total: number }>("/invoices/me?limit=50"),
    enabled: !!user,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const currentYear = new Date().getFullYear();
  const yearTotal =
    data?.items
      .filter(
        (i) =>
          i.status !== "CANCELLED" &&
          new Date(i.issuedAt).getFullYear() === currentYear,
      )
      .reduce((sum, i) => sum + i.amountTtc, 0) ?? 0;

  async function handleDownload(inv: InvoiceItem) {
    setDownloadingId(inv.id);
    setDownloadError(null);
    try {
      await downloadPdf(inv.id, inv.number);
    } catch {
      setDownloadError("Impossible de télécharger la facture. Réessayez.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Mes factures</h1>
            <p className="mt-1 text-sm text-gray-500">
              Rétrocessions d&apos;honoraires mensuelles
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            ← Tableau de bord
          </button>
        </header>

        {/* KPI */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total facturé {currentYear}
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-dark">
            {yearTotal.toFixed(2)} MAD
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Net après commission Medapp (montant perçu)
          </p>
        </div>

        {/* Liste */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {isPending ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-red-600">
              Impossible de charger les factures.
            </p>
          ) : !data || data.items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Aucune facture pour l&apos;instant.</p>
              <p className="mt-1 text-sm text-gray-400">
                Les factures mensuelles sont générées le 1er de chaque mois.
              </p>
            </div>
          ) : (
            <>
              {downloadError && (
                <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
                  {downloadError}
                </p>
              )}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left">N° Facture</th>
                    <th className="px-6 py-3 text-left">Période</th>
                    <th className="px-6 py-3 text-left">Date émission</th>
                    <th className="px-6 py-3 text-right">Montant net</th>
                    <th className="px-6 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 text-center">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.items.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {inv.number}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatPeriod(inv.periodStart, inv.periodEnd)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(inv.issuedAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800">
                        {inv.amountTtc.toFixed(2)} {inv.currency}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status]}`}
                        >
                          {STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDownload(inv)}
                          disabled={downloadingId === inv.id}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {downloadingId === inv.id ? "…" : "Télécharger"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
