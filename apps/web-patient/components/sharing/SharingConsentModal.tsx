"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Lock, X } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  onClose: () => void;
}

export function SharingConsentModal({ onClose }: Props) {
  const qc = useQueryClient();
  const [checked, setChecked] = useState(false);

  const enable = useMutation({
    mutationFn: () => api.post("/patients/me/sharing-consent", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sharing-consent"] });
      localStorage.setItem("sharingModalSeen", "1");
      onClose();
    },
  });

  function handleLater() {
    localStorage.setItem("sharingModalSeen", "1");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-brand px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-white" />
            <h2 className="text-base font-bold text-white">Continuité de vos soins</h2>
          </div>
          <button
            onClick={handleLater}
            className="rounded-full p-1 text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-gray-700">
          <p>
            Sur Medapp, votre dossier médical peut être partagé entre tous les médecins
            de la plateforme — comme dans un cabinet de groupe.
          </p>

          <div className="rounded-xl bg-green-50 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Avantages</p>
            {[
              "Le médecin connaît votre historique",
              "Pas besoin de tout réexpliquer à chaque consultation",
              "Meilleur suivi sur le long terme",
              "Détection des interactions médicamenteuses",
            ].map((item) => (
              <p key={item} className="flex items-start gap-2 text-green-800">
                <span className="mt-0.5 text-green-500">✓</span>
                {item}
              </p>
            ))}
          </div>

          <div className="rounded-xl bg-blue-50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Sécurité & confidentialité</p>
            </div>
            {[
              "Seuls les médecins en consultation active avec vous y accèdent",
              "Chaque accès est tracé et visible dans votre espace",
              "Vous pouvez exclure certaines consultations du partage",
              "Vous pouvez révoquer le partage à tout moment",
            ].map((item) => (
              <p key={item} className="flex items-start gap-2 text-blue-800">
                <span className="mt-0.5 text-blue-400">•</span>
                {item}
              </p>
            ))}
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-brand"
            />
            <span className="text-sm text-gray-700">
              J&apos;ai lu les conditions et j&apos;accepte le partage de mon dossier médical
              conformément à la{" "}
              <span className="font-medium text-brand">politique CNDP (Loi 09-08)</span> et aux{" "}
              <span className="font-medium text-brand">CGU Medapp (version 2026-05-v1)</span>.
            </span>
          </label>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleLater}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Plus tard
          </button>
          <button
            onClick={() => enable.mutate()}
            disabled={!checked || enable.isPending}
            className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {enable.isPending ? "Activation…" : "Activer le partage"}
          </button>
        </div>
      </div>
    </div>
  );
}
