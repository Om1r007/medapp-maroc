"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, User, Lock, CreditCard, Stethoscope, Hash, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { AuthResponse, SignupDoctorDto } from "@medapp/shared-types";

const CIN_REGEX = /^[A-Z]{1,2}[0-9]{5,6}$/;
const SPECIALITIES = [
  "Médecine générale",
  "Cardiologie",
  "Dermatologie",
  "Gynécologie",
  "Neurologie",
  "Ophtalmologie",
  "ORL",
  "Pédiatrie",
  "Psychiatrie",
  "Rhumatologie",
  "Urologie",
  "Autre",
];

type Step = 1 | 2 | 3;

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const step = (i + 1) as Step;
        const done = step < current;
        const active = step === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                done || active
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-200 text-neutral-500",
              )}
            >
              {done ? "✓" : step}
            </div>
            {i < total - 1 && (
              <div
                className={cn(
                  "h-px w-8 transition-colors",
                  done ? "bg-primary-500" : "bg-neutral-200",
                )}
              />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-neutral-500">
        Étape {current} sur {total}
      </span>
    </div>
  );
}

export default function SignupDoctorPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<SignupDoctorDto>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+212",
    password: "",
    cin: "",
    ordreNumber: "",
    speciality: "Médecine générale",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof SignupDoctorDto | "confirmPassword", string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignupDoctorDto>(key: K, value: SignupDoctorDto[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep1() {
    const e: typeof errors = {};
    if (!form.firstName.trim()) e.firstName = "Prénom requis";
    if (!form.lastName.trim()) e.lastName = "Nom requis";
    if (!form.email.includes("@")) e.email = "Email invalide";
    if (!/^\+212[0-9]{9}$/.test(form.phone)) e.phone = "Format: +212XXXXXXXXX";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: typeof errors = {};
    if (!CIN_REGEX.test(form.cin)) e.cin = "Format CIN invalide (ex: AB123456)";
    if (!form.ordreNumber.trim()) e.ordreNumber = "Numéro d'ordre requis";
    if (!form.speciality.trim()) e.speciality = "Spécialité requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e: typeof errors = {};
    if (form.password.length < 8) e.password = "Minimum 8 caractères";
    if (form.password !== confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const data = await api.post<AuthResponse>("/auth/signup/doctor", form);
      setAuth(data);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = (err.payload as { message?: string | string[] })?.message ?? "Erreur lors de l'inscription";
        setSubmitError(Array.isArray(msg) ? msg.join(", ") : msg);
      } else {
        setSubmitError("Erreur réseau. Réessayez dans quelques instants.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">
            Medapp <span className="text-neutral-400 font-normal">Praticien</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-900">
                Créer un compte praticien
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Votre dossier sera vérifié avant activation (N° Ordre des Médecins)
              </p>
            </div>

            {/* Pending verification notice */}
            <div className="mb-6 flex items-start gap-3 bg-warning-50 border border-warning-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning-700">
                Après inscription, votre compte sera examiné par notre équipe sous 24–48h. Vous recevrez un email de confirmation.
              </p>
            </div>

            <StepIndicator current={step} total={3} />

            {/* Step 1 — Identity */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    iconLeft={<User className="h-4 w-4" />}
                    errorMessage={errors.firstName}
                    autoComplete="given-name"
                  />
                  <Input
                    label="Nom"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    errorMessage={errors.lastName}
                    autoComplete="family-name"
                  />
                </div>
                <Input
                  label="Email professionnel"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  iconLeft={<Mail className="h-4 w-4" />}
                  errorMessage={errors.email}
                  autoComplete="email"
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  iconLeft={<Phone className="h-4 w-4" />}
                  helperText="Format: +212XXXXXXXXX"
                  errorMessage={errors.phone}
                  autoComplete="tel"
                />
                <Button fullWidth size="lg" onClick={handleNext}>
                  Continuer
                </Button>
              </div>
            )}

            {/* Step 2 — Professional credentials */}
            {step === 2 && (
              <div className="space-y-4">
                <Input
                  label="Numéro CIN"
                  value={form.cin}
                  onChange={(e) => update("cin", e.target.value.toUpperCase())}
                  iconLeft={<CreditCard className="h-4 w-4" />}
                  helperText="Carte d'identité nationale marocaine (ex: AB123456)"
                  errorMessage={errors.cin}
                  maxLength={8}
                />
                <Input
                  label="N° Ordre des Médecins"
                  value={form.ordreNumber}
                  onChange={(e) => update("ordreNumber", e.target.value)}
                  iconLeft={<Hash className="h-4 w-4" />}
                  helperText="Numéro d'inscription au Conseil de l'Ordre"
                  errorMessage={errors.ordreNumber}
                />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Spécialité
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <select
                      value={form.speciality}
                      onChange={(e) => update("speciality", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm appearance-none",
                        "border-neutral-300 bg-white text-neutral-900",
                        "focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
                        errors.speciality && "border-error-500",
                      )}
                    >
                      {SPECIALITIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {errors.speciality && (
                    <p className="mt-1 text-xs text-error-700">{errors.speciality}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button fullWidth size="lg" onClick={handleNext}>
                    Continuer
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — Password */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Mot de passe"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  iconLeft={<Lock className="h-4 w-4" />}
                  helperText="Minimum 8 caractères"
                  errorMessage={errors.password}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((err) => ({ ...err, confirmPassword: undefined }));
                  }}
                  iconLeft={<Lock className="h-4 w-4" />}
                  errorMessage={errors.confirmPassword}
                  autoComplete="new-password"
                />

                {submitError && (
                  <p className="text-sm text-error-700 bg-error-50 rounded-lg p-3">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth type="button" onClick={() => setStep(2)}>
                    Retour
                  </Button>
                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    Soumettre ma candidature
                  </Button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-neutral-500">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
