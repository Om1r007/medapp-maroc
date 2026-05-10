"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Heart,
  Pill,
  History,
  Stethoscope,
  FileText,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import type { SharedPatientHistory } from "@medapp/shared-types";

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
  recurrence?: {
    previousConsultationsCount: number;
    lastConsultationDate: string | null;
    lastConsultationSymptom: string | null;
  };
}

const SEX_LABELS = { M: "Homme", F: "Femme", OTHER: "Autre" } as const;

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {icon}
      {label}
    </div>
  );
}

export function PatientFilePanel({ consultationId }: { consultationId: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<"profile" | "history">("profile");
  const [expandedConsult, setExpandedConsult] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery<PatientSummary>({
    queryKey: ["patient-summary", consultationId],
    queryFn: () =>
      api.get<PatientSummary>(`/doctors/me/consultations/${consultationId}/patient-summary`),
    staleTime: 60_000,
  });

  const { data: sharedHistory, isLoading: historyLoading } = useQuery<SharedPatientHistory>({
    queryKey: ["patient-history", consultationId],
    queryFn: () =>
      api.get<SharedPatientHistory>(
        `/doctors/me/consultations/${consultationId}/patient-history`,
      ),
    staleTime: 30_000,
    retry: false,
  });

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex flex-col items-center gap-1 rounded-r-xl bg-white px-2 py-4 shadow-md hover:bg-gray-50"
        title="Voir le dossier patient"
      >
        <User className="h-4 w-4 text-brand" />
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>
    );
  }

  const patient = summary?.patient;

  return (
    <aside className="flex w-72 flex-shrink-0 flex-col bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-brand" />
          <span className="text-sm font-semibold text-gray-800">📋 Dossier patient</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-1 hover:bg-gray-200"
        >
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setOpenSection("profile")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            openSection === "profile"
              ? "border-b-2 border-brand text-brand"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Profil santé
        </button>
        <button
          onClick={() => setOpenSection("history")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            openSection === "history"
              ? "border-b-2 border-brand text-brand"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Historique
          {sharedHistory?.hasConsent && sharedHistory.history.length > 0 && (
            <span className="ml-1 rounded-full bg-brand/10 px-1.5 py-0.5 text-brand text-xs">
              {sharedHistory.history.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {/* ── Profile section ── */}
        {openSection === "profile" && (
          <>
            {summaryLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-200" />
                ))}
              </div>
            ) : !patient ? (
              <p className="text-xs text-gray-400">Informations non disponibles.</p>
            ) : (
              <>
                {/* Identité */}
                <div>
                  <p className="font-semibold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {patient.age} ans
                    {patient.sex && ` · ${SEX_LABELS[patient.sex]}`}
                  </p>
                  {(patient.heightCm || patient.weightKg || patient.bloodType) && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {patient.bloodType && `Groupe ${patient.bloodType}`}
                      {patient.heightCm && ` · ${patient.heightCm} cm`}
                      {patient.weightKg && ` · ${patient.weightKg} kg`}
                    </p>
                  )}
                  {summary?.recurrence && summary.recurrence.previousConsultationsCount > 0 && (
                    <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                      <p className="text-xs font-medium text-amber-800">
                        ⭐ Patient avec relation établie — {summary.recurrence.previousConsultationsCount} consultation{summary.recurrence.previousConsultationsCount > 1 ? "s" : ""} antérieure{summary.recurrence.previousConsultationsCount > 1 ? "s" : ""}
                      </p>
                      {summary.recurrence.lastConsultationDate && (
                        <p className="text-xs text-amber-700 mt-0.5">
                          Dernière :{" "}
                          {new Date(summary.recurrence.lastConsultationDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {summary.recurrence.lastConsultationSymptom &&
                            ` · ${summary.recurrence.lastConsultationSymptom}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Allergies */}
                <div>
                  <SectionHeader
                    icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    label="Allergies"
                  />
                  {patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((a) => (
                        <span key={a} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
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
                  <SectionHeader
                    icon={<Heart className="h-3.5 w-3.5 text-orange-500" />}
                    label="Antécédents"
                  />
                  {patient.conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.conditions.map((c) => (
                        <span key={c} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
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
                  <SectionHeader
                    icon={<Pill className="h-3.5 w-3.5 text-blue-500" />}
                    label="Médicaments"
                  />
                  {patient.medications.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.medications.map((m) => (
                        <span key={m} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
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
          </>
        )}

        {/* ── History section ── */}
        {openSection === "history" && (
          <>
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-200" />
                ))}
              </div>
            ) : !sharedHistory?.hasConsent ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <p className="text-xs font-medium text-amber-800">Partage non activé</p>
                </div>
                <p className="text-xs text-amber-700">
                  Ce patient n&apos;a pas activé le partage de son dossier. Vous ne voyez que ses informations de profil santé et le brief de cette consultation.
                </p>
              </div>
            ) : sharedHistory.history.length === 0 ? (
              <p className="text-xs text-gray-400">
                Aucune consultation antérieure disponible.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-3">
                  <History className="h-3.5 w-3.5 text-brand" />
                  <p className="text-xs font-medium text-brand">
                    {sharedHistory.history.length} consultation{sharedHistory.history.length > 1 ? "s" : ""} partagée{sharedHistory.history.length > 1 ? "s" : ""}
                  </p>
                </div>

                <ul className="space-y-3">
                  {sharedHistory.history.map((c) => (
                    <li key={c.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400">
                            📅{" "}
                            {new Date(c.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {" · "}
                            {c.doctorName}
                          </p>
                          {c.mainSymptom && (
                            <p className="mt-1 text-xs font-medium text-gray-700">
                              <Stethoscope className="inline h-3 w-3 mr-1 text-brand" />
                              {c.mainSymptom}
                            </p>
                          )}
                          {c.diagnosis && expandedConsult !== c.id && (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                              <FileText className="inline h-3 w-3 mr-1" />
                              {c.diagnosis}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setExpandedConsult(expandedConsult === c.id ? null : c.id)
                          }
                          className="text-xs text-brand hover:underline flex-shrink-0"
                        >
                          {expandedConsult === c.id ? "Réduire" : "Voir"}
                        </button>
                      </div>

                      {expandedConsult === c.id && (
                        <div className="mt-2 space-y-2 border-t border-gray-200 pt-2">
                          {c.diagnosis && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Diagnostic</p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{c.diagnosis}</p>
                            </div>
                          )}
                          {c.prescription && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Prescription</p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{c.prescription}</p>
                            </div>
                          )}
                          {c.doctorSpeciality && (
                            <p className="text-xs text-gray-400">{c.doctorSpeciality}</p>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs text-gray-400 text-center">
                  Ce patient a autorisé le partage de son dossier entre médecins Medapp.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
