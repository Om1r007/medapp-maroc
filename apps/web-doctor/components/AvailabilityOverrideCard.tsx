"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";

interface Doctor {
  isAvailable: boolean;
  manualOverride?: boolean | null;
  manualOverrideUntil?: string | null;
}

interface Props {
  doctor: Doctor;
}

const OPTIONS = [
  { label: "Mode automatique (calendrier)", value: "auto" },
  { label: "Forcer disponible — 30 min", value: "on-30" },
  { label: "Forcer disponible — 1h", value: "on-60" },
  { label: "Forcer disponible (permanent)", value: "on-perm" },
  { label: "Forcer indisponible — 1h", value: "off-60" },
  { label: "Forcer indisponible (permanent)", value: "off-perm" },
] as const;

type OptionValue = (typeof OPTIONS)[number]["value"];

export function AvailabilityOverrideCard({ doctor }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<OptionValue>("auto");

  const hasOverride = doctor.manualOverride !== null && doctor.manualOverride !== undefined;

  const { mutate: applyOption, isPending } = useMutation({
    mutationFn: async (value: OptionValue) => {
      if (value === "auto") {
        return api.delete("/availability/override");
      }
      const isAvailable = value.startsWith("on");
      const durationMinutes =
        value.includes("30") ? 30
        : value.includes("60") ? 60
        : undefined;
      return api.post("/availability/override", { isAvailable, durationMinutes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "me"] });
    },
  });

  const handleChange = (value: OptionValue) => {
    setSelected(value);
    applyOption(value);
  };

  const overrideLabel = (() => {
    if (!hasOverride) return null;
    const until = doctor.manualOverrideUntil
      ? new Date(doctor.manualOverrideUntil).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
    return doctor.manualOverride
      ? `Override actif : Disponible${until ? ` jusqu'à ${until}` : " (permanent)"}`
      : `Override actif : Indisponible${until ? ` jusqu'à ${until}` : " (permanent)"}`;
  })();

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mode de disponibilité</h2>
          <p className="mt-1 text-sm text-gray-500">
            L'override manuel prime sur le calendrier automatique.
          </p>
          {overrideLabel && (
            <p className="mt-2 text-sm font-medium text-amber-600">{overrideLabel}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            doctor.isAvailable
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${doctor.isAvailable ? "bg-green-500" : "bg-gray-400"}`} />
          {doctor.isAvailable ? "Disponible" : "Indisponible"}
        </span>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-gray-700">Action rapide</label>
        <select
          value={selected}
          onChange={(e) => handleChange(e.target.value as OptionValue)}
          disabled={isPending}
          className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
