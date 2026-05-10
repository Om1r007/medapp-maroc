"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { StarRating } from "@/components/doctor/StarRating";

const PREDEFINED_TAGS = [
  "Professionnel",
  "À l'écoute",
  "Diagnostic clair",
  "Patient",
  "Disponible",
  "Empathique",
  "Pédagogue",
];

interface ConsultationSummary {
  id: string;
  status: string;
  doctor: { firstName: string; lastName: string; speciality: string } | null;
}

interface RatingResult {
  doctorId?: string;
}

export default function RatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useRequireAuth();
  const router = useRouter();

  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedDoctorId, setSubmittedDoctorId] = useState<string | null>(null);
  const [wantsReferring, setWantsReferring] = useState(false);
  const [referringDone, setReferringDone] = useState(false);

  const { data: consultation } = useQuery<ConsultationSummary>({
    queryKey: ["consultation-summary", id],
    queryFn: () => api.get<ConsultationSummary>(`/consultations/${id}/summary`),
    enabled: !!user,
  });

  const { data: existingRating } = useQuery({
    queryKey: ["rating", id],
    queryFn: () => api.get(`/consultations/${id}/rating`),
    enabled: !!user,
    retry: false,
  });

  // Check if a referring doctor is already set
  const { data: referringData } = useQuery<{ referringDoctor: { id: string } | null }>({
    queryKey: ["referring-doctor"],
    queryFn: () => api.get("/patients/me/referring-doctor"),
    enabled: !!user,
  });

  const hasReferringDoctor = !!referringData?.referringDoctor;

  const { mutate: submitRating, isPending } = useMutation({
    mutationFn: () =>
      api.post<RatingResult>(`/consultations/${id}/rate`, {
        stars,
        feedback: feedback.trim() || undefined,
        tags: selectedTags,
      }),
    onSuccess: (data) => {
      setSubmittedDoctorId(data?.doctorId ?? null);
      setSubmitted(true);
      if (!wantsReferring || !data?.doctorId) {
        setTimeout(() => router.push(`/consultations/${id}/summary`), 2000);
      }
    },
  });

  const { mutate: setReferring, isPending: isSettingReferring } = useMutation({
    mutationFn: (doctorId: string) =>
      api.patch("/patients/me/referring-doctor", { doctorId }),
    onSuccess: () => {
      setReferringDone(true);
      setTimeout(() => router.push(`/consultations/${id}/summary`), 1500);
    },
  });

  if (!user) return null;

  const doctorName = consultation?.doctor
    ? `Dr. ${consultation.doctor.firstName} ${consultation.doctor.lastName}`
    : "votre médecin";

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  if (submitted) {
    // Offer to set as referring doctor
    if (stars >= 4 && !hasReferringDoctor && submittedDoctorId && !referringDone) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl">⭐</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Merci pour votre avis !</h2>
              <p className="mt-2 text-sm text-gray-500">
                Vous avez attribué {stars}/5 à {doctorName}.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-brand/30 bg-brand/5 p-4">
              <p className="text-sm font-semibold text-brand-dark">
                Désigner comme médecin référent ?
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Votre médecin référent sera prioritaire lors de vos prochaines consultations sur Medapp.
              </p>
              <label className="mt-3 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsReferring}
                  onChange={(e) => setWantsReferring(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand accent-brand"
                />
                <span className="text-sm text-gray-700">
                  Oui, désigner {doctorName} comme mon médecin référent
                </span>
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => router.push(`/consultations/${id}/summary`)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Plus tard
              </button>
              {wantsReferring && (
                <button
                  onClick={() => setReferring(submittedDoctorId)}
                  disabled={isSettingReferring}
                  className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
                >
                  {isSettingReferring ? "Enregistrement..." : "Confirmer"}
                </button>
              )}
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-3xl">{referringDone ? "🩺" : "⭐"}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {referringDone ? "Médecin référent enregistré !" : "Merci pour votre avis !"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {referringDone
              ? `${doctorName} est maintenant votre médecin référent.`
              : "Votre retour aide à maintenir notre standard qualité."}
          </p>
          <button
            onClick={() => router.push(`/consultations/${id}/summary`)}
            className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Voir le résumé
          </button>
        </div>
      </main>
    );
  }

  if (existingRating) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-3xl">⭐</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Déjà noté</h2>
          <p className="mt-2 text-sm text-gray-500">
            Vous avez déjà noté cette consultation.
          </p>
          <button
            onClick={() => router.push(`/consultations/${id}/summary`)}
            className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Voir le résumé
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-10">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
            <Stethoscope className="h-7 w-7 text-brand" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Comment s&apos;est passée votre consultation ?
          </h1>
          <p className="mt-1 text-sm text-gray-500">avec {doctorName}</p>
        </div>

        {/* Stars */}
        <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
          <p className="mb-4 text-sm font-medium text-gray-700">Votre note</p>
          <div className="flex justify-center">
            <StarRating value={stars} onChange={setStars} size={40} />
          </div>
          {stars > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              {["", "Décevant", "Peut mieux faire", "Correct", "Bien", "Excellent !"][stars]}
            </p>
          )}
        </div>

        {/* Tags */}
        {stars >= 3 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium text-gray-700">
              Ce qui vous a plu (facultatif)
            </p>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Commentaire{" "}
            <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Partagez votre expérience…"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {feedback.length}/500
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/consultations/${id}/summary`)}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Passer cette étape
          </button>
          <button
            onClick={() => submitRating()}
            disabled={stars === 0 || isPending}
            className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {isPending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </main>
  );
}
