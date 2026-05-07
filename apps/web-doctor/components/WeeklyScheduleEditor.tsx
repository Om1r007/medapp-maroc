"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AvailabilitySlot } from "@medapp/shared-types";

// Jours affichés du lundi (1) au dimanche (0), ordre marocain
const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

export function WeeklyScheduleEditor() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["availability", "slots"],
    queryFn: () => api.get<AvailabilitySlot[]>("/availability/slots"),
  });

  const { mutate: createSlot, isPending: isCreating } = useMutation({
    mutationFn: () => api.post("/availability/slots", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "slots"] });
      setShowForm(false);
      setFormError(null);
      setForm({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" });
    },
    onError: (err: unknown) => {
      const msg = (err as { payload?: { message?: string } })?.payload?.message;
      setFormError(Array.isArray(msg) ? msg[0] : (msg ?? "Erreur lors de la création"));
    },
  });

  const { mutate: deleteSlot, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/availability/slots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "slots"] });
      setDeleteTarget(null);
    },
  });

  // Regroupe les créneaux par jour
  const byDay = DAYS.map((day) => ({
    ...day,
    slots: slots.filter((s) => s.dayOfWeek === day.value).sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    ),
  }));

  const hasAnySlot = slots.length > 0;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Créneaux récurrents</h2>
        <button
          onClick={() => { setShowForm(true); setFormError(null); }}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
        >
          + Ajouter un créneau
        </button>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-gray-400">Chargement…</p>
      )}

      {!isLoading && !hasAnySlot && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Vous n'avez pas encore défini votre planning.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Créez vos premiers créneaux pour permettre aux patients de vous trouver automatiquement.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
          >
            Créer mon premier créneau
          </button>
        </div>
      )}

      {hasAnySlot && (
        <div className="mt-5 space-y-3">
          {byDay.map((day) =>
            day.slots.length === 0 ? null : (
              <div key={day.value} className="flex items-start gap-4">
                <span className="w-24 shrink-0 pt-1 text-sm font-medium text-gray-600">
                  {day.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5"
                    >
                      <span className="text-sm text-green-800 font-medium">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(slot.id)}
                        className="ml-1 text-green-400 hover:text-red-500 text-xs"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Nouveau créneau</h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Jour</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Début</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Fin</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                disabled={isCreating}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => createSlot()}
                disabled={isCreating}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
              >
                {isCreating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Supprimer ce créneau ?</h3>
            <p className="mt-2 text-sm text-gray-600">Cette action est irréversible.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteSlot(deleteTarget)}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
