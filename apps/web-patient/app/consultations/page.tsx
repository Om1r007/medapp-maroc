"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/navigation/BottomNav";
import type { ConsultationStatus } from "@medapp/shared-types";

interface ConsultationItem {
  id: string;
  status: ConsultationStatus;
  reason: string | null;
  diagnosis: string | null;
  amount: number;
  createdAt: string;
  endedAt: string | null;
  doctor: { firstName: string; lastName: string; speciality: string } | null;
}

interface ConsultationsResponse {
  items: ConsultationItem[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Toutes" },
  { value: "COMPLETED", label: "Terminées" },
  { value: "CANCELLED", label: "Annulées" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "IN_QUEUE", label: "En file" },
];

const PERIOD_OPTIONS = [
  { value: "", label: "Tout" },
  { value: "3m", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "1y", label: "1 an" },
];

function periodToFrom(period: string): string | undefined {
  if (!period) return undefined;
  const now = new Date();
  if (period === "3m") now.setMonth(now.getMonth() - 3);
  else if (period === "6m") now.setMonth(now.getMonth() - 6);
  else if (period === "1y") now.setFullYear(now.getFullYear() - 1);
  return now.toISOString();
}

function RowSkeleton() {
  return (
    <div className="px-6 py-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export default function ConsultationsPage() {
  const user = useRequireAuth();
  const router = useRouter();

  const [status, setStatus] = useState("ALL");
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery<ConsultationsResponse>({
    queryKey: ["consultations-list", status, period, search, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(status !== "ALL" && { status }),
        ...(period && { from: periodToFrom(period) ?? "" }),
        ...(search && { search }),
      });
      return api.get<ConsultationsResponse>(`/patients/me/consultations?${params}`);
    },
    enabled: !!user,
  });

  if (!user) return null;

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="mx-auto w-full max-w-3xl flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="text-base font-semibold text-neutral-900">Mes consultations</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-6">
        {/* Filtres */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher par médecin…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              OK
            </button>
          </div>

          {/* Statut pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatus(opt.value); setPage(1); }}
                className={cn(
                  "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  status === opt.value
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Période pills */}
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPeriod(opt.value); setPage(1); }}
                className={cn(
                  "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  period === opt.value
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : !data?.items.length ? (
            <div className="p-8">
              <EmptyState
                title="Aucune consultation trouvée"
                description="Essayez de modifier vos filtres."
              />
            </div>
          ) : (
            <>
              <ul className="divide-y divide-neutral-100">
                {data.items.map((c) => (
                  <li
                    key={c.id}
                    className="cursor-pointer px-6 py-4 transition-colors hover:bg-neutral-50"
                    onClick={() => router.push(`/consultations/${c.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 text-sm">
                          {c.doctor
                            ? `Dr ${c.doctor.firstName} ${c.doctor.lastName}`
                            : "Médecin non assigné"}
                        </p>
                        {c.doctor && (
                          <p className="text-xs text-neutral-500">{c.doctor.speciality}</p>
                        )}
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        {c.reason && (
                          <p className="mt-1 text-xs text-neutral-500 line-clamp-1">{c.reason}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={c.status} />
                        <span className="text-xs font-medium text-neutral-600">
                          {c.amount} MAD
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
                  <p className="text-xs text-neutral-500">
                    {data.total} consultation{data.total !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-lg p-1.5 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-neutral-600 min-w-[4ch] text-center">
                      {page} / {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg p-1.5 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
