"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Shield, Heart, Pill, ChevronRight, LogOut } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BottomNav } from "@/components/navigation/BottomNav";
import type { ConsultationStatus } from "@medapp/shared-types";

interface DashboardSummary {
  user: { firstName: string; lastName: string; photoUrl: string | null };
  activeConsultation: { id: string; status: ConsultationStatus } | null;
  recentConsultations: {
    id: string;
    status: ConsultationStatus;
    reason: string | null;
    amount: number;
    createdAt: string;
    doctor: { firstName: string; lastName: string; speciality: string } | null;
  }[];
  healthProfile: { allergies: string[]; conditions: string[]; medications: string[] };
  liveStats: { doctorsAvailable: number; avgWaitMinutes: number };
}

function getActiveRedirect(status: ConsultationStatus, id: string): string {
  if (status === "WAITING_PAYMENT") return `/payment/${id}`;
  if (status === "WAITING_PRE_CONSULT") return `/consultation/${id}/pre-consult`;
  if (status === "IN_QUEUE") return `/queue/${id}`;
  return `/consultation/${id}`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const { logout } = useAuthStore();
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [showStickyBtn, setShowStickyBtn] = useState(false);

  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get<DashboardSummary>("/patients/me/dashboard-summary"),
    enabled: !!user,
    refetchInterval: 15_000,
    refetchOnMount: "always",
    staleTime: 0,
  });

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setShowStickyBtn(!(entries[0]?.isIntersecting ?? true)),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-6">
      {/* TopBar */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-neutral-900 text-sm tracking-tight">Medapp</span>
          </div>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Hero */}
            {summary?.activeConsultation ? (
              <section className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-1">
                      Consultation en cours
                    </p>
                    <h2 className="font-semibold text-neutral-900">
                      Vous avez une consultation active
                    </h2>
                    <div className="mt-1">
                      <StatusBadge status={summary.activeConsultation.status} />
                    </div>
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        router.push(
                          getActiveRedirect(
                            summary.activeConsultation!.status,
                            summary.activeConsultation!.id,
                          ),
                        )
                      }
                    >
                      Reprendre ma consultation
                    </Button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="pt-2">
                <p className="text-sm text-neutral-500 mb-1">
                  Bonjour, {summary?.user.firstName ?? user.email}
                </p>
                <h1 className="text-3xl font-bold text-neutral-900 leading-tight">
                  Comment vous<br />sentez-vous ?
                </h1>
                <p className="mt-3 text-neutral-500">
                  Consultez un médecin disponible en moins de 15 minutes.
                </p>

                <Button
                  ref={ctaRef}
                  size="lg"
                  fullWidth
                  className="mt-5 h-16 text-base"
                  onClick={() => router.push("/consultations/new")}
                  iconLeft={<Stethoscope className="h-5 w-5" />}
                >
                  Consulter maintenant · 150 MAD
                </Button>

                {/* Live indicator */}
                {summary && (
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full flex-shrink-0",
                        summary.liveStats.doctorsAvailable > 0
                          ? "bg-success-500 animate-pulse"
                          : "bg-neutral-300",
                      )}
                    />
                    <span className="text-sm text-neutral-500">
                      {summary.liveStats.doctorsAvailable > 0 ? (
                        <>
                          <span className="font-medium text-neutral-700">
                            {summary.liveStats.doctorsAvailable}
                          </span>{" "}
                          médecin{summary.liveStats.doctorsAvailable !== 1 ? "s" : ""} disponible
                          {summary.liveStats.doctorsAvailable !== 1 ? "s" : ""}
                          {summary.liveStats.avgWaitMinutes > 0 && (
                            <> · ~{summary.liveStats.avgWaitMinutes} min d&apos;attente</>
                          )}
                        </>
                      ) : (
                        "Aucun médecin disponible actuellement"
                      )}
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* Consultations récentes */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <SectionTitle
                title="Consultations récentes"
                action={{ label: "Voir tout", href: "/consultations" }}
              />

              {!summary?.recentConsultations.length ? (
                <EmptyState
                  title="Aucune consultation"
                  description="Votre historique apparaîtra ici après votre première consultation."
                />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {summary.recentConsultations.map((c) => (
                    <li
                      key={c.id}
                      className="-mx-2 cursor-pointer rounded-lg px-2 py-3 transition-colors hover:bg-neutral-50"
                      onClick={() => router.push(`/consultations/${c.id}`)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {c.doctor
                              ? `Dr ${c.doctor.firstName} ${c.doctor.lastName}`
                              : "Médecin non assigné"}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                            {c.doctor && (
                              <span className="text-neutral-400"> · {c.doctor.speciality}</span>
                            )}
                          </p>
                          {c.reason && (
                            <p className="mt-0.5 text-xs text-neutral-400 truncate">{c.reason}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StatusBadge status={c.status} />
                          <span className="text-xs text-neutral-500">{c.amount} MAD</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Profil santé */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <SectionTitle
                title="Mon profil santé"
                action={{ label: "Mettre à jour", href: "/profile?tab=health" }}
              />
              <p className="text-sm text-neutral-500 mb-4">
                Maintenez-le à jour pour des consultations plus efficaces.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <HealthItem
                  icon={<Shield className="h-4 w-4 text-error-500" />}
                  label="Allergies"
                  items={summary?.healthProfile.allergies ?? []}
                  emptyText="Aucune allergie connue"
                />
                <HealthItem
                  icon={<Heart className="h-4 w-4 text-warning-500" />}
                  label="Antécédents"
                  items={summary?.healthProfile.conditions ?? []}
                  emptyText="Aucun antécédent"
                />
                <HealthItem
                  icon={<Pill className="h-4 w-4 text-primary-500" />}
                  label="Médicaments"
                  items={summary?.healthProfile.medications ?? []}
                  emptyText="Aucun médicament"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => router.push("/profile?tab=health")}
                iconRight={<ChevronRight className="h-4 w-4" />}
              >
                Mettre à jour mon profil santé
              </Button>
            </section>
          </>
        )}
      </main>

      {/* Sticky CTA — mobile only, appears when main CTA is out of view */}
      {showStickyBtn && !summary?.activeConsultation && (
        <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-2 md:hidden">
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push("/consultations/new")}
            className="shadow-xl"
          >
            Consulter maintenant · 150 MAD
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function HealthItem({
  icon,
  label,
  items,
  emptyText,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-medium text-neutral-600">{label}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.slice(0, 3).map((item) => (
            <li key={item} className="text-xs text-neutral-700">
              · {item}
            </li>
          ))}
          {items.length > 3 && (
            <li className="text-xs text-neutral-400">+{items.length - 3} autres</li>
          )}
        </ul>
      ) : (
        <p className="text-xs text-neutral-400">{emptyText}</p>
      )}
    </div>
  );
}
