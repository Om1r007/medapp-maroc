"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, User, AlertTriangle, Heart, Pill } from "lucide-react";
import { api } from "@/lib/api";

interface PatientSummary {
  patient: {
    firstName: string;
    lastName: string;
    age: number;
    sex: "M" | "F" | "OTHER" | null;
    bloodType: string | null;
    heightCm: number | null;
    weightKg: number | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
  };
  consultation: { reason: string | null };
}

const SEX_LABELS = { M: "Homme", F: "Femme", OTHER: "Autre" } as const;

export function PatientSummaryPanel({ consultationId }: { consultationId: string }) {
  const [collapsed, setCollapsed] = useState(false);

  const { data, isLoading } = useQuery<PatientSummary>({
    queryKey: ["patient-summary", consultationId],
    queryFn: () =>
      api.get<PatientSummary>(`/doctors/me/consultations/${consultationId}/patient-summary`),
    staleTime: 60_000,
  });

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex flex-col items-center gap-1 rounded-r-xl bg-white px-2 py-4 shadow-md hover:bg-gray-50"
        title="Voir le profil patient"
      >
        <User className="h-4 w-4 text-brand" />
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>
    );
  }

  return (
    <aside className="flex w-72 flex-shrink-0 flex-col rounded-2xl bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-brand" />
          <span className="text-sm font-semibold text-gray-800">Profil patient</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-1 hover:bg-gray-100"
          title="Réduire"
        >
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        ) : !data ? (
          <p className="text-xs text-gray-400">Informations non disponibles.</p>
        ) : (
          <>
            {/* Identité */}
            <div>
              <p className="font-semibold text-gray-900">
                {data.patient.firstName} {data.patient.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {data.patient.age} ans
                {data.patient.sex && ` · ${SEX_LABELS[data.patient.sex]}`}
              </p>
              {(data.patient.heightCm || data.patient.weightKg || data.patient.bloodType) && (
                <p className="mt-1 text-xs text-gray-500">
                  {data.patient.bloodType && `Groupe ${data.patient.bloodType}`}
                  {data.patient.heightCm && ` · ${data.patient.heightCm} cm`}
                  {data.patient.weightKg && ` · ${data.patient.weightKg} kg`}
                </p>
              )}
            </div>

            {/* Motif */}
            {data.consultation.reason && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Motif</p>
                <p className="text-xs text-gray-700 rounded-lg bg-blue-50 p-2">
                  {data.consultation.reason}
                </p>
              </div>
            )}

            {/* Allergies */}
            <div>
              <div className="mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-medium text-gray-600">Allergies</span>
              </div>
              {data.patient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {data.patient.allergies.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Aucune allergie connue</p>
              )}
            </div>

            {/* Antécédents */}
            <div>
              <div className="mb-1 flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-medium text-gray-600">Antécédents</span>
              </div>
              {data.patient.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {data.patient.conditions.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Aucun antécédent</p>
              )}
            </div>

            {/* Médicaments */}
            <div>
              <div className="mb-1 flex items-center gap-1">
                <Pill className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium text-gray-600">Médicaments</span>
              </div>
              {data.patient.medications.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {data.patient.medications.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Aucun médicament</p>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
