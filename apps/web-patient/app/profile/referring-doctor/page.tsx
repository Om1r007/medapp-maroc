"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Trash2, Star } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import type { ReferringDoctor, PastDoctor } from "@medapp/shared-types";

export default function ReferringDoctorPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [showSetConfirm, setShowSetConfirm] = useState<PastDoctor | null>(null);

  const { data: referringData, isLoading: referringLoading } = useQuery<{
    referringDoctor: ReferringDoctor | null;
  }>({
    queryKey: ["referring-doctor"],
    queryFn: () => api.get("/patients/me/referring-doctor"),
    enabled: !!user,
  });

  const { data: pastDoctors, isLoading: pastLoading } = useQuery<PastDoctor[]>({
    queryKey: ["past-doctors"],
    queryFn: () => api.get("/patients/me/past-doctors"),
    enabled: !!user,
  });

  const { mutate: setReferring, isPending: isSetting } = useMutation({
    mutationFn: (doctorId: string) =>
      api.patch("/patients/me/referring-doctor", { doctorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referring-doctor"] });
      setShowSetConfirm(null);
    },
  });

  const { mutate: removeReferring, isPending: isRemoving } = useMutation({
    mutationFn: () => api.delete("/patients/me/referring-doctor"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referring-doctor"] });
      setShowConfirmRemove(false);
    },
  });

  if (!user) return null;

  const referringDoctor = referringData?.referringDoctor;

  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="mx-auto max-w-xl space-y-6">
        <button
          onClick={() => router.push("/profile")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour au profil
        </button>

        <div>
          <h1 className="text-2xl font-bold text-brand-dark">
            Médecin référent
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Votre médecin référent sera prioritaire lors de vos prochaines consultations.
          </p>
        </div>

        {/* Current referring doctor */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Médecin référent actuel
          </h2>

          {referringLoading ? (
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ) : referringDoctor ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                  <UserCheck className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Dr. {referringDoctor.firstName} {referringDoctor.lastName}
                  </p>
                  {referringDoctor.speciality && (
                    <p className="text-sm text-gray-500">{referringDoctor.speciality}</p>
                  )}
                  {referringDoctor.qualityScore && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-600">
                        {referringDoctor.qualityScore.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {referringDoctor.setAt && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Désigné le{" "}
                      {new Date(referringDoctor.setAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowConfirmRemove(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Retirer
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <UserCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">
                Aucun médecin référent désigné
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Choisissez un médecin parmi vos consultations passées ci-dessous.
              </p>
            </div>
          )}
        </section>

        {/* Past doctors list */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Médecins consultés
          </h2>

          {pastLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : !pastDoctors || pastDoctors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Aucune consultation terminée pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pastDoctors.map((doctor) => {
                const isCurrent = referringDoctor?.id === doctor.id;
                return (
                  <li key={doctor.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-sm font-semibold text-gray-600">
                          {doctor.firstName[0]}{doctor.lastName[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Dr. {doctor.firstName} {doctor.lastName}
                          {isCurrent && (
                            <span className="ml-2 rounded-full bg-brand/10 px-1.5 py-0.5 text-xs text-brand">
                              Référent
                            </span>
                          )}
                        </p>
                        {doctor.speciality && (
                          <p className="text-xs text-gray-500 truncate">{doctor.speciality}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Dernière consultation :{" "}
                          {new Date(doctor.lastConsultationDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="flex-shrink-0 text-xs text-brand font-medium">✓ Référent</span>
                    ) : (
                      <button
                        onClick={() => setShowSetConfirm(doctor)}
                        className="flex-shrink-0 rounded-lg border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5"
                      >
                        Désigner
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="text-xs text-gray-400 text-center px-4">
          Vous pouvez modifier votre médecin référent à tout moment. Seuls les médecins avec qui vous avez déjà consulté peuvent être désignés.
        </p>
      </div>

      {/* Confirm set referring doctor modal */}
      {showSetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Confirmer le médecin référent
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Désigner{" "}
              <strong>
                Dr. {showSetConfirm.firstName} {showSetConfirm.lastName}
              </strong>{" "}
              comme votre médecin référent ?
              {referringDoctor && (
                <span className="block mt-1 text-amber-700">
                  Cela remplacera votre référent actuel (Dr.{" "}
                  {referringDoctor.firstName} {referringDoctor.lastName}).
                </span>
              )}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowSetConfirm(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => setReferring(showSetConfirm.id)}
                disabled={isSetting}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
              >
                {isSetting ? "Enregistrement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {showConfirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Retirer le médecin référent
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Voulez-vous retirer{" "}
              <strong>
                Dr. {referringDoctor?.firstName} {referringDoctor?.lastName}
              </strong>{" "}
              de votre liste référente ? Vous pourrez en désigner un autre à tout moment.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirmRemove(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => removeReferring()}
                disabled={isRemoving}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isRemoving ? "Suppression..." : "Retirer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
