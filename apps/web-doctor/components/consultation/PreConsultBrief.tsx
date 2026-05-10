"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, AlertTriangle, Pill, Heart, Shield } from "lucide-react";
import { api } from "@/lib/api";
import type { PreConsultData } from "@medapp/shared-types";

interface Brief {
  patient: {
    firstName: string;
    lastName: string;
    age: number;
    sex: "M" | "F" | "OTHER" | null;
  };
  preConsultData: PreConsultData | null;
  preConsultMode: "STANDARD" | "EXPRESS" | "URGENT";
  isUrgent: boolean;
}

const DURATION_LABELS: Record<string, string> = {
  less24h: "Moins de 24h",
  "1to3d": "1 à 3 jours",
  "4to7d": "4 à 7 jours",
  "1to2w": "1 à 2 semaines",
  more2w: "Plus de 2 semaines",
  chronic: "Chronique",
};

function painDesc(level: number): string {
  if (level <= 2) return "😊 Léger";
  if (level <= 5) return "😐 Modéré";
  if (level <= 8) return "😣 Important";
  return "😱 Intense";
}

export function PreConsultBrief({ consultationId }: { consultationId: string }) {
  const [collapsed, setCollapsed] = useState(false);

  const { data, isLoading } = useQuery<Brief>({
    queryKey: ["pre-consult-brief", consultationId],
    queryFn: () =>
      api.get<Brief>(`/consultations/${consultationId}/pre-consult/brief`),
    staleTime: 30_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.preConsultData) return null;

  const pc = data.preConsultData;

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${data.isUrgent ? "border-red-300" : "border-gray-200"} bg-white`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left ${data.isUrgent ? "bg-red-50" : "bg-gray-50"}`}
      >
        <div className="flex items-center gap-2">
          {data.isUrgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
          <span className="text-sm font-semibold text-gray-800">
            Brief — {data.patient.firstName} {data.patient.lastName}, {data.patient.age} ans
          </span>
          {data.isUrgent && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
              URGENT
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {!collapsed && (
        <div className="p-4 space-y-3 text-sm">
          {/* Symptôme principal */}
          <BriefRow icon="🩺" label="Symptôme" value={pc.mainSymptom} />

          {/* Durée */}
          {pc.duration && (
            <BriefRow
              icon="⏱️"
              label="Durée"
              value={DURATION_LABELS[pc.duration] ?? pc.duration}
            />
          )}

          {/* Douleur */}
          {pc.painLevel !== null ? (
            <BriefRow
              icon="😣"
              label="Douleur"
              value={`${pc.painLevel}/10 — ${painDesc(pc.painLevel)}`}
              className={pc.painLevel >= 7 ? "text-red-600 font-medium" : ""}
            />
          ) : (
            <BriefRow icon="😊" label="Douleur" value="Aucune / Question" />
          )}

          {/* Allergies */}
          {pc.allergiesSnapshot.length > 0 ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 mb-1">
                <Shield className="h-3.5 w-3.5" />
                <span>Allergies</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {pc.allergiesSnapshot.map((a) => (
                  <span key={a} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">⚠️ Allergies : non renseignées</p>
          )}

          {/* Médicaments */}
          {pc.medicationsSnapshot.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 mb-1">
                <Pill className="h-3.5 w-3.5" />
                <span>Médicaments</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {pc.medicationsSnapshot.map((m) => (
                  <span key={m} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Antécédents */}
          {pc.conditionsSnapshot.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 mb-1">
                <Heart className="h-3.5 w-3.5" />
                <span>Antécédents</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {pc.conditionsSnapshot.map((c) => (
                  <span key={c} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note patient */}
          {pc.additionalInfo && (
            <div className="rounded-lg bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium text-blue-700 mb-0.5">💬 Note du patient</p>
              <p className="text-xs text-blue-800 italic">&ldquo;{pc.additionalInfo}&rdquo;</p>
            </div>
          )}

          {/* Urgent note */}
          {pc.urgentNote && (
            <div className="rounded-lg bg-red-50 px-3 py-2">
              <p className="text-xs font-medium text-red-700 mb-0.5">🚨 Urgence</p>
              <p className="text-xs text-red-800 italic">&ldquo;{pc.urgentNote}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefRow({
  icon,
  label,
  value,
  className = "",
}: {
  icon: string;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-base flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 flex-shrink-0">{label} :</span>
      <span className={`text-sm text-gray-800 ${className}`}>{value}</span>
    </div>
  );
}
