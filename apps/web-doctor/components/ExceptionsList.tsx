"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/error-message";
import type { AvailabilityException, ExceptionType } from "@medapp/shared-types";

const TYPE_LABELS: Record<ExceptionType, string> = {
  BLOCKED: "Indisponible (blocage)",
  EXTRA_AVAILABILITY: "Disponibilité exceptionnelle",
};

const TYPE_COLORS: Record<ExceptionType, string> = {
  BLOCKED: "bg-red-50 border-red-200 text-red-800",
  EXTRA_AVAILABILITY: "bg-blue-50 border-blue-200 text-blue-800",
};

function formatDT(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExceptionsList() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    startsAt: "",
    endsAt: "",
    type: "BLOCKED" as ExceptionType,
    reason: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const from = new Date().toISOString();

  const { data: exceptions = [], isLoading } = useQuery({
    queryKey: ["availability", "exceptions"],
    queryFn: () =>
      api.get<AvailabilityException[]>(`/availability/exceptions?from=${from}`),
  });

  const { mutate: createException, isPending: isCreating } = useMutation({
    mutationFn: () =>
      api.post("/availability/exceptions", {
        ...form,
        reason: form.reason.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "exceptions"] });
      setShowModal(false);
      setFormError(null);
      setForm({ startsAt: "", endsAt: "", type: "BLOCKED", reason: "" });
    },
    onError: (err: unknown) => {
      setFormError(extractErrorMessage(err, "Erreur lors de la création"));
    },
  });

  const { mutate: deleteException, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/availability/exceptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "exceptions"] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Exceptions à venir</h2>
        <button
          onClick={() => { setShowModal(true); setFormError(null); }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          + Ajouter une exception
        </button>
      </div>

      {isLoading && <p className="mt-4 text-sm text-gray-400">Chargement…</p>}

      {!isLoading && exceptions.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">Aucune exception planifiée.</p>
      )}

      {exceptions.length > 0 && (
        <div className="mt-4 space-y-2">
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${TYPE_COLORS[exc.type]}`}
            >
              <div>
                <p className="text-sm font-medium">{TYPE_LABELS[exc.type]}</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Du {formatDT(exc.startsAt)} au {formatDT(exc.endsAt)}
                </p>
                {exc.reason && (
                  <p className="text-xs mt-0.5 opacity-70">{exc.reason}</p>
                )}
              </div>
              <button
                onClick={() => setDeleteTarget(exc.id)}
                className="shrink-0 text-xs opacity-60 hover:opacity-100"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Nouvelle exception</h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ExceptionType }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="BLOCKED">Indisponible (congé, RDV externe…)</option>
                  <option value="EXTRA_AVAILABILITY">Disponible exceptionnellement</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Début</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Fin</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Raison <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Congé, formation, RDV personnel…"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowModal(false); setFormError(null); }}
                disabled={isCreating}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => createException()}
                disabled={isCreating || !form.startsAt || !form.endsAt}
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
            <h3 className="text-lg font-bold text-gray-900">Supprimer cette exception ?</h3>
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
                onClick={() => deleteException(deleteTarget)}
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
