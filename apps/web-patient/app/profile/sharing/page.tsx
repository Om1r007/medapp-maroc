"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Shield,
  Clock,
  EyeOff,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/navigation/BottomNav";
import type {
  SharingConsent,
  FileAccessLogEntry,
  ExcludedConsultationEntry,
} from "@medapp/shared-types";

const ACCESS_TYPE_LABELS: Record<string, string> = {
  VIEW_PROFILE: "a consulté votre profil santé",
  VIEW_HISTORY: "a consulté votre historique de consultations",
  VIEW_CONSULTATION: "a ouvert le détail d'une consultation",
  VIEW_DOCUMENT: "a téléchargé un document",
};

export default function SharingPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [reincluding, setReincluding] = useState<string | null>(null);

  const { data: consent, isLoading: consentLoading } = useQuery<SharingConsent>({
    queryKey: ["sharing-consent"],
    queryFn: () => api.get<SharingConsent>("/patients/me/sharing-consent"),
    enabled: !!user,
  });

  const { data: history } = useQuery<FileAccessLogEntry[]>({
    queryKey: ["sharing-history"],
    queryFn: () => api.get<FileAccessLogEntry[]>("/patients/me/sharing-history"),
    enabled: !!user,
  });

  const { data: excluded } = useQuery<ExcludedConsultationEntry[]>({
    queryKey: ["sharing-excluded"],
    queryFn: () => api.get<ExcludedConsultationEntry[]>("/patients/me/sharing-excluded"),
    enabled: !!user,
  });

  const enable = useMutation({
    mutationFn: () => api.post("/patients/me/sharing-consent", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sharing-consent"] }),
  });

  const disable = useMutation({
    mutationFn: () => api.delete("/patients/me/sharing-consent"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sharing-consent"] });
      setShowDisableConfirm(false);
    },
  });

  const reinclude = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/consultations/${id}/include-in-sharing`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sharing-excluded"] });
      setReincluding(null);
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Partage du dossier médical</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-6">
        {/* Status card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className={`mt-0.5 h-5 w-5 flex-shrink-0 ${consent?.isEnabled ? "text-green-500" : "text-gray-400"}`} />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Statut du partage</h2>

              {consentLoading ? (
                <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
              ) : consent?.isEnabled ? (
                <>
                  <p className="mt-1 text-sm text-green-700 font-medium">
                    ✅ Activé
                    {consent.enabledAt && (
                      <span className="font-normal text-gray-500 ml-1">
                        depuis le{" "}
                        {new Date(consent.enabledAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Les médecins Medapp en consultation active avec vous peuvent accéder à votre historique médical.
                  </p>

                  {!showDisableConfirm ? (
                    <button
                      onClick={() => setShowDisableConfirm(true)}
                      className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Désactiver le partage
                    </button>
                  ) : (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-800 font-medium">Confirmer la désactivation ?</p>
                      <p className="mt-1 text-xs text-red-700">
                        La désactivation prendra effet pour vos prochaines consultations. Les médecins ayant déjà accédé à votre dossier conservent leur accès dans le cadre de leur prise en charge actuelle.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setShowDisableConfirm(false)}
                          className="flex-1 rounded-lg border border-gray-300 py-2 text-sm hover:bg-white"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => disable.mutate()}
                          disabled={disable.isPending}
                          className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {disable.isPending ? "…" : "Désactiver"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-gray-500">
                    Le partage de votre dossier est désactivé. Seul le médecin de la consultation en cours peut voir vos informations de base.
                  </p>
                  <button
                    onClick={() => enable.mutate()}
                    disabled={enable.isPending}
                    className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                  >
                    {enable.isPending ? "Activation…" : "Activer le partage"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Excluded consultations */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <EyeOff className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">
              Consultations exclues du partage
              {excluded && excluded.length > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {excluded.length}
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Ces consultations ne seront pas visibles par d&apos;autres médecins.
          </p>

          {!excluded || excluded.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune consultation exclue.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {excluded.map((c) => (
                <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(c.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {c.doctorName && (
                        <span className="text-gray-500 font-normal ml-1">— {c.doctorName}</span>
                      )}
                    </p>
                    {c.excludedReason && (
                      <p className="mt-0.5 text-xs text-gray-400 italic">{c.excludedReason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReincluding(c.id);
                      reinclude.mutate(c.id);
                    }}
                    disabled={reincluding === c.id && reinclude.isPending}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Réintégrer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Access history */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Historique des accès</h2>
          </div>

          {!history || history.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun médecin n&apos;a encore accédé à votre dossier.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((log) => (
                <li key={log.id} className="py-3">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{log.doctorName}</span>
                    {" "}
                    <span className="text-gray-500">{ACCESS_TYPE_LABELS[log.accessType] ?? log.accessType}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(log.accessedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    <span className="text-gray-400">pendant votre consultation</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Legal note */}
        <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <AlertTriangle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            Le traitement de vos données de santé est encadré par la Loi 09-08 (CNDP) et la Loi 131-13 (télémédecine).
            Chaque accès médecin est tracé et conservé 2 ans.
            Pour exercer vos droits (accès, rectification, suppression), contactez support@medapp.ma.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
