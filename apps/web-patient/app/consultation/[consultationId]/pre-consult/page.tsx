"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import type { PreConsultData, PreConsultMode } from "@medapp/shared-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Duration = PreConsultData["duration"];

interface PatientProfile {
  allergies: string[];
  conditions: string[];
  medications: string[];
  bloodType: string | null;
}

interface WizardState {
  mainSymptom: string;
  isCustomSymptom: boolean;
  duration: Duration | "";
  painLevel: number | null;
  noPain: boolean;
  additionalInfo: string;
}

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "less24h", label: "Moins de 24 heures" },
  { value: "1to3d", label: "1 à 3 jours" },
  { value: "4to7d", label: "4 à 7 jours" },
  { value: "1to2w", label: "1 à 2 semaines" },
  { value: "more2w", label: "Plus de 2 semaines" },
  { value: "chronic", label: "Chronique / Récurrent" },
];

function painEmoji(level: number): { emoji: string; label: string; color: string } {
  if (level <= 2) return { emoji: "😊", label: "Léger inconfort", color: "text-green-600" };
  if (level <= 5) return { emoji: "😐", label: "Inconfort modéré", color: "text-yellow-600" };
  if (level <= 8) return { emoji: "😣", label: "Douleur importante", color: "text-orange-600" };
  return { emoji: "😱", label: "Douleur intense", color: "text-red-600" };
}

function painTrackColor(level: number): string {
  if (level <= 2) return "accent-green-500";
  if (level <= 5) return "accent-yellow-500";
  if (level <= 8) return "accent-orange-500";
  return "accent-red-500";
}

// ─── Step: Symptom ────────────────────────────────────────────────────────────

function SymptomStep({
  symptoms,
  value,
  isCustom,
  onChange,
}: {
  symptoms: string[];
  value: string;
  isCustom: boolean;
  onChange: (symptom: string, custom: boolean) => void;
}) {
  const [search, setSearch] = useState(value && isCustom ? value : "");
  const [showCustom, setShowCustom] = useState(isCustom);

  const filtered = symptoms.filter(
    (s) => s !== "Autre" && s.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Quel est votre symptôme principal ?</h2>
        <p className="mt-1 text-sm text-gray-500">Sélectionnez ou tapez le motif de votre consultation.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowCustom(false);
          }}
          placeholder="Rechercher un symptôme…"
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* List */}
      <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-gray-100 bg-gray-50 p-2">
        {filtered.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { onChange(s, false); setSearch(s); }}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              value === s && !isCustom
                ? "bg-brand text-white"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            {s}
          </button>
        ))}
        {filtered.length === 0 && search.trim() && (
          <p className="px-3 py-2 text-xs text-gray-400">Aucun résultat — utilisez &quot;Autre&quot;</p>
        )}
      </div>

      {/* Custom / Autre */}
      {!showCustom ? (
        <button
          type="button"
          onClick={() => { setShowCustom(true); setSearch(""); onChange("", true); }}
          className="text-sm text-brand underline"
        >
          Autre (saisie libre)
        </button>
      ) : (
        <div>
          <input
            type="text"
            value={isCustom ? value : ""}
            onChange={(e) => onChange(e.target.value, true)}
            placeholder="Décrivez votre symptôme…"
            maxLength={200}
            autoFocus
            className="w-full rounded-xl border border-brand px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}
    </div>
  );
}

// ─── Step: Duration ───────────────────────────────────────────────────────────

function DurationStep({
  value,
  onChange,
}: {
  value: Duration | "";
  onChange: (v: Duration) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Depuis combien de temps ?</h2>
        <p className="mt-1 text-sm text-gray-500">Choisissez la durée approximative.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border-2 px-3 py-3 text-sm font-medium text-left transition-all ${
              value === opt.value
                ? "border-brand bg-brand-50 text-brand"
                : "border-gray-200 text-gray-700 hover:border-brand-light"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step: Pain ───────────────────────────────────────────────────────────────

function PainStep({
  value,
  noPain,
  onChange,
  onNoPain,
}: {
  value: number;
  noPain: boolean;
  onChange: (v: number) => void;
  onNoPain: (v: boolean) => void;
}) {
  const info = noPain ? null : painEmoji(value);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Niveau de douleur ou d&apos;inconfort</h2>
        <p className="mt-1 text-sm text-gray-500">Sur une échelle de 0 à 10.</p>
      </div>

      {!noPain && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>0 — Aucune</span>
            <span>10 — Insupportable</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`w-full h-3 rounded-lg cursor-pointer ${painTrackColor(value)}`}
          />
          <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
            <span className="text-3xl">{info?.emoji}</span>
            <div>
              <p className={`text-base font-bold ${info?.color}`}>{value}/10</p>
              <p className={`text-xs ${info?.color}`}>{info?.label}</p>
            </div>
          </div>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
        <input
          type="checkbox"
          checked={noPain}
          onChange={(e) => onNoPain(e.target.checked)}
          className="h-4 w-4 rounded accent-brand"
        />
        <span className="text-sm text-gray-700">
          Pas de douleur, juste une question
        </span>
      </label>
    </div>
  );
}

// ─── Step: Health Info ────────────────────────────────────────────────────────

function HealthInfoStep({ profile }: { profile: PatientProfile | undefined }) {
  const router = useRouter();
  const hasData =
    (profile?.allergies.length ?? 0) > 0 ||
    (profile?.conditions.length ?? 0) > 0 ||
    (profile?.medications.length ?? 0) > 0 ||
    !!profile?.bloodType;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Allergies & médicaments</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ces informations seront transmises au médecin.
        </p>
      </div>

      {hasData ? (
        <div className="space-y-3">
          {(profile?.allergies.length ?? 0) > 0 && (
            <InfoRow label="Allergies connues" values={profile!.allergies} color="red" />
          )}
          {(profile?.medications.length ?? 0) > 0 && (
            <InfoRow label="Médicaments actuels" values={profile!.medications} color="blue" />
          )}
          {(profile?.conditions.length ?? 0) > 0 && (
            <InfoRow label="Antécédents" values={profile!.conditions} color="orange" />
          )}
          {profile?.bloodType && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Groupe sanguin</p>
              <p className="mt-0.5 text-sm font-medium text-gray-800">{profile.bloodType}</p>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-xs text-green-700">
            <span>✓</span>
            <span>Ces informations sont à jour et seront partagées avec le médecin.</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/profile?tab=health")}
            className="text-sm text-brand underline"
          >
            Modifier mon profil santé
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Profil santé non rempli</p>
            <p className="mt-1 text-xs">
              Indiquez vos allergies et médicaments pour que le médecin puisse prescrire en toute sécurité.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Sans allergie ni médicament connu, le médecin sera informé. Vous pouvez compléter votre profil santé dans les paramètres.
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile?tab=health")}
            className="text-sm text-brand underline"
          >
            Remplir mon profil santé maintenant →
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  values,
  color,
}: {
  label: string;
  values: string[];
  color: "red" | "blue" | "orange";
}) {
  const cls = {
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  }[color];

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Step: Additional Info ────────────────────────────────────────────────────

function AdditionalInfoStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Informations complémentaires{" "}
          <span className="text-base font-normal text-gray-400">(optionnel)</span>
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Y a-t-il quelque chose d&apos;autre que le médecin devrait savoir ?
        </p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ex : grossesse en cours, voyage récent, contact avec une personne malade…"
        rows={5}
        maxLength={500}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
      />
      <p className="text-right text-xs text-gray-400">{value.length}/500</p>
    </div>
  );
}

// ─── Urgent Mode ──────────────────────────────────────────────────────────────

function UrgentMode({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (note: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        <div>
          <p className="font-semibold text-red-800">Mode urgent</p>
          <p className="mt-0.5 text-sm text-red-700">
            Décrivez en une phrase votre urgence. Le médecin recevra un flag URGENT.
          </p>
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="ex : douleur thoracique intense depuis 30 min, difficultés à respirer…"
        rows={4}
        maxLength={500}
        autoFocus
        className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Retour
        </button>
        <button
          type="button"
          disabled={!note.trim() || isLoading}
          onClick={() => onSubmit(note)}
          className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? "Envoi…" : "Entrer en file (URGENT)"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STORAGE_KEY = (id: string) => `pre-consult-${id}`;

export default function PreConsultPage({
  params,
}: {
  params: Promise<{ consultationId: string }>;
}) {
  const { consultationId } = use(params);
  const user = useRequireAuth();
  const router = useRouter();

  // Load symptoms
  const { data: symptomsData } = useQuery({
    queryKey: ["symptoms"],
    queryFn: () => api.get<{ symptoms: string[] }>("/symptoms/suggestions"),
    staleTime: Infinity,
  });

  // Load patient profile for health info
  const { data: profile } = useQuery<PatientProfile>({
    queryKey: ["patient-me-health"],
    queryFn: () => api.get<PatientProfile>("/patients/me"),
    enabled: !!user,
    staleTime: 60_000,
  });

  const hasCompleteProfile =
    (profile?.allergies.length ?? 0) > 0 &&
    (profile?.conditions.length ?? 0) > 0 &&
    (profile?.medications.length ?? 0) > 0;

  const expressMode = hasCompleteProfile;

  // Total steps depends on mode
  const totalSteps = expressMode ? 3 : 5;

  // Restore from localStorage
  const [state, setState] = useState<WizardState>(() => {
    if (typeof window === "undefined") {
      return { mainSymptom: "", isCustomSymptom: false, duration: "", painLevel: 5, noPain: false, additionalInfo: "" };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY(consultationId));
      if (saved) return JSON.parse(saved) as WizardState;
    } catch {}
    return { mainSymptom: "", isCustomSymptom: false, duration: "", painLevel: 5, noPain: false, additionalInfo: "" };
  });

  const [step, setStep] = useState(1);
  const [urgentMode, setUrgentMode] = useState(false);
  const [error, setError] = useState("");

  // Persist to localStorage on state change
  const persist = useCallback((s: WizardState) => {
    setState(s);
    try {
      localStorage.setItem(STORAGE_KEY(consultationId), JSON.stringify(s));
    } catch {}
  }, [consultationId]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (body: object) =>
      api.post(`/consultations/${consultationId}/pre-consult`, body),
    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEY(consultationId));
      router.push(`/queue/${consultationId}`);
    },
    onError: () => setError("Une erreur est survenue. Veuillez réessayer."),
  });

  if (!user) return null;

  const symptoms = symptomsData?.symptoms ?? [];

  // Navigation
  function canNext(): boolean {
    if (step === 1) return !!state.mainSymptom.trim();
    if (step === 2) return !!state.duration;
    if (step === 3) return state.noPain || state.painLevel !== null;
    return true;
  }

  function goNext() {
    setError("");
    if (!canNext()) {
      setError("Veuillez répondre à cette question pour continuer.");
      return;
    }
    if (step < totalSteps) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function goPrev() {
    setError("");
    if (step > 1) setStep((s) => s - 1);
  }

  function handleSubmit() {
    submit({
      mainSymptom: state.mainSymptom,
      isCustomSymptom: state.isCustomSymptom,
      duration: state.duration || "less24h",
      painLevel: state.noPain ? null : state.painLevel,
      additionalInfo: state.additionalInfo,
      mode: expressMode ? "EXPRESS" : "STANDARD",
    });
  }

  function handleUrgentSubmit(urgentNote: string) {
    submit({
      mainSymptom: urgentNote,
      isCustomSymptom: true,
      duration: "less24h",
      painLevel: null,
      additionalInfo: "",
      urgentNote,
      mode: "URGENT",
    });
  }

  // Map display step to actual step content
  // Express: 1=Symptom, 2=Duration, 3=Pain → submit
  // Standard: 1=Symptom, 2=Duration, 3=Pain, 4=Health, 5=Additional → submit
  function renderStep() {
    if (urgentMode) {
      return (
        <UrgentMode
          onSubmit={handleUrgentSubmit}
          onCancel={() => setUrgentMode(false)}
          isLoading={isPending}
        />
      );
    }

    if (step === 1) {
      return (
        <SymptomStep
          symptoms={symptoms}
          value={state.mainSymptom}
          isCustom={state.isCustomSymptom}
          onChange={(s, c) => persist({ ...state, mainSymptom: s, isCustomSymptom: c })}
        />
      );
    }
    if (step === 2) {
      return (
        <DurationStep
          value={state.duration}
          onChange={(d) => persist({ ...state, duration: d })}
        />
      );
    }
    if (step === 3) {
      return (
        <PainStep
          value={state.painLevel ?? 5}
          noPain={state.noPain}
          onChange={(v) => persist({ ...state, painLevel: v })}
          onNoPain={(v) => persist({ ...state, noPain: v })}
        />
      );
    }
    if (step === 4 && !expressMode) {
      return <HealthInfoStep profile={profile} />;
    }
    if ((step === 5 && !expressMode) || (step === 4 && expressMode)) {
      return (
        <AdditionalInfoStep
          value={state.additionalInfo}
          onChange={(v) => persist({ ...state, additionalInfo: v })}
        />
      );
    }
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Pré-consultation</p>
            <p className="text-xs text-gray-400">⏱ ~60 secondes</p>
          </div>
          {expressMode && !urgentMode && (
            <p className="mt-1 text-xs text-green-600">
              ✓ Mode express activé — votre profil santé est à jour
            </p>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {!urgentMode && (
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-1.5 bg-brand transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      )}

      <div className="mx-auto max-w-lg px-6 py-8 pb-32">
        {!urgentMode && (
          <p className="mb-6 text-xs text-gray-400">
            Étape {step} sur {totalSteps}
          </p>
        )}

        {/* Step content */}
        <div className="animate-in fade-in duration-200">
          {renderStep()}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Navigation */}
        {!urgentMode && (
          <div className="mt-8 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={goPrev}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {step < totalSteps ? (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : isPending ? (
                "Envoi en cours…"
              ) : (
                "Entrer en file d'attente →"
              )}
            </button>
          </div>
        )}

        {/* Urgent link — discrete */}
        {!urgentMode && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setUrgentMode(true)}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              C&apos;est urgent, pas le temps
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
