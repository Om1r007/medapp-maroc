"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Download } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";

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

const STATUS_MAP: Record<
  InvoiceItem["status"],
  { label: string; variant: "neutral" | "success" | "warning" }
> = {
  ISSUED: { label: "Émise", variant: "warning" },
  PAID: { label: "Payée", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "neutral" },
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
  return new Date(start).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="mx-auto w-full max-w-4xl flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-neutral-900">Mes factures</h1>
            <p className="text-xs text-neutral-400">Rétrocessions d'honoraires mensuelles</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-6">
        {/* KPI */}
        <KpiCard
          label={`Total facturé ${currentYear}`}
          value={`${yearTotal.toFixed(2)} MAD`}
          subLabel="Net après commission Medapp"
        />

        {/* Error message */}
        {downloadError && (
          <div className="bg-error-50 border border-error-200 rounded-lg px-4 py-3">
            <p className="text-sm text-error-700">{downloadError}</p>
          </div>
        )}

        {/* Invoice list */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {isPending ? (
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-error-600">Impossible de charger les factures.</p>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-10">
              <EmptyState
                title="Aucune facture"
                description="Les factures mensuelles sont générées le 1er de chaque mois."
              />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        N° Facture
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Montant net
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        PDF
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.items.map((inv) => {
                      const s = STATUS_MAP[inv.status];
                      return (
                        <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-neutral-800">
                            {inv.number}
                          </td>
                          <td className="px-6 py-4 text-neutral-600">
                            {formatPeriod(inv.periodStart, inv.periodEnd)}
                          </td>
                          <td className="px-6 py-4 text-neutral-500">
                            {new Date(inv.issuedAt).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-neutral-800">
                            {inv.amountTtc.toFixed(2)} {inv.currency}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDownload(inv)}
                              disabled={downloadingId === inv.id}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700",
                                "hover:bg-neutral-50 disabled:opacity-50 transition-colors",
                              )}
                            >
                              <Download className="h-3.5 w-3.5" />
                              {downloadingId === inv.id ? "…" : "Télécharger"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-neutral-100">
                {data.items.map((inv) => {
                  const s = STATUS_MAP[inv.status];
                  return (
                    <div key={inv.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-800 text-sm">{inv.number}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {formatPeriod(inv.periodStart, inv.periodEnd)}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {new Date(inv.issuedAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-semibold text-neutral-900 text-sm">
                            {inv.amountTtc.toFixed(2)} {inv.currency}
                          </span>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={downloadingId === inv.id}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {downloadingId === inv.id ? "Téléchargement…" : "Télécharger PDF"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
