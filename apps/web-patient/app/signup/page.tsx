"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, User, Lock, CreditCard } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { AuthResponse, SignupPatientDto } from "@medapp/shared-types";

const CIN_REGEX = /^[A-Z]{1,2}[0-9]{5,6}$/;

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
                done
                  ? "bg-primary-500 text-white"
                  : active
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

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<SignupPatientDto>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+212",
    password: "",
    cin: "",
    dateOfBirth: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupPatientDto | "confirmPassword" | "cgu", string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignupPatientDto>(key: K, value: SignupPatientDto[K]) {
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
    if (!form.dateOfBirth) e.dateOfBirth = "Date de naissance requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e: typeof errors = {};
    if (form.password.length < 8) e.password = "Minimum 8 caractères";
    if (form.password !== confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!acceptCgu) e.cgu = "Vous devez accepter les CGU";
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
      const data = await api.post<AuthResponse>("/auth/signup/patient", form);
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
      {/* Minimal TopBar */}
      <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-neutral-900 text-sm tracking-tight">Medapp</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-900">Créer un compte</h1>
              <p className="mt-1 text-sm text-neutral-500">Rejoignez Medapp gratuitement</p>
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
                  label="Adresse email"
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

            {/* Step 2 — CIN + Date of birth */}
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
                  label="Date de naissance"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                  errorMessage={errors.dateOfBirth}
                />
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

            {/* Step 3 — Password + CGU */}
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

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptCgu}
                    onChange={(e) => {
                      setAcceptCgu(e.target.checked);
                      setErrors((err) => ({ ...err, cgu: undefined }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-primary-500"
                  />
                  <span className="text-sm text-neutral-700">
                    J&apos;accepte les{" "}
                    <span className="text-primary-600 font-medium">conditions générales d&apos;utilisation</span>{" "}
                    et la{" "}
                    <span className="text-primary-600 font-medium">politique de confidentialité</span>
                  </span>
                </label>
                {errors.cgu && <p className="text-sm text-error-700">{errors.cgu}</p>}

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
                    Créer mon compte
                  </Button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-neutral-500">
              Déjà un compte ?{" "}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
