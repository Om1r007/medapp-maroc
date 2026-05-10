"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Tabs from "@radix-ui/react-tabs";
import { toast } from "sonner";
import {
  ChevronLeft,
  Camera,
  Loader2,
  Save,
  AlertTriangle,
  Share2,
  UserCheck,
} from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { SharingConsentModal } from "@/components/sharing/SharingConsentModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  cin: string;
  dateOfBirth: string;
  sex: "M" | "F" | "OTHER" | null;
  city: string | null;
  photoUrl: string | null;
  bloodType: string | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  email: string;
  phone: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Inconnu"];

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="ml-0.5 text-primary-500 hover:text-error-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-neutral-900 mb-1.5">{children}</p>;
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const user = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const defaultTab = searchParams.get("tab") === "health" ? "health"
    : searchParams.get("tab") === "security" ? "security"
    : "info";

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);

  const { data: profile, isLoading } = useQuery<PatientProfile>({
    queryKey: ["patient-me"],
    queryFn: () => api.get<PatientProfile>("/patients/me"),
    enabled: !!user,
  });

  // Info form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "OTHER" | "">("");
  const [city, setCity] = useState("");

  // Health form state
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [bloodType, setBloodType] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setDateOfBirth(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "");
    setSex(profile.sex ?? "");
    setCity(profile.city ?? "");
    setAllergies(profile.allergies ?? []);
    setConditions(profile.conditions ?? []);
    setMedications(profile.medications ?? []);
    setBloodType(profile.bloodType ?? "");
    setHeightCm(profile.heightCm != null ? String(profile.heightCm) : "");
    setWeightKg(profile.weightKg != null ? String(profile.weightKg) : "");
  }, [profile]);

  const updateInfo = useMutation({
    mutationFn: () =>
      api.put("/patients/me/profile", {
        email: email || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        sex: sex || undefined,
        city: city || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-me"] });
      toast.success("Profil mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const updateHealth = useMutation({
    mutationFn: () =>
      api.put("/patients/me/health-profile", {
        allergies,
        conditions,
        medications,
        bloodType: bloodType || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-me"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Profil santé mis à jour");
      if (!localStorage.getItem("sharingModalSeen")) {
        setShowSharingModal(true);
      }
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const updatePassword = useMutation({
    mutationFn: () =>
      api.put("/patients/me/password", { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwError("");
      toast.success("Mot de passe modifié");
    },
    onError: (e: unknown) => {
      const msg = (e as { payload?: { message?: string } })?.payload?.message;
      setPwError(msg ?? "Erreur lors du changement de mot de passe");
    },
  });

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem("patientAccessToken");
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`${API_URL}/api/patients/me/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["patient-me"] });
        qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
        toast.success("Photo mise à jour");
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Le nouveau mot de passe doit comporter au moins 8 caractères");
      return;
    }
    updatePassword.mutate();
  }

  if (!user) return null;

  const TAB_ITEMS = [
    { key: "info", label: "Identité" },
    { key: "health", label: "Santé" },
    { key: "security", label: "Sécurité" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="mx-auto max-w-3xl w-full flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-neutral-900">Mon profil</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 space-y-4">
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <>
            {/* Avatar section */}
            <div className="flex flex-col items-center py-4">
              <div className="relative">
                {profile?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}${profile.photoUrl}`}
                    alt="Photo de profil"
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <Avatar
                    firstName={profile?.firstName}
                    lastName={profile?.lastName}
                    size="xl"
                  />
                )}
                <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary-500 p-1.5 shadow-sm hover:bg-primary-600 transition-colors">
                  {uploadingPhoto ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-3.5 w-3.5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                {profile?.firstName} {profile?.lastName}
              </p>
            </div>

            {/* Tabs */}
            <Tabs.Root defaultValue={defaultTab}>
              <Tabs.List className="flex border-b border-neutral-200 bg-white rounded-t-xl overflow-hidden">
                {TAB_ITEMS.map(({ key, label }) => (
                  <Tabs.Trigger
                    key={key}
                    value={key}
                    className={cn(
                      "flex-1 py-3 text-sm font-medium transition-colors",
                      "data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600",
                      "data-[state=inactive]:text-neutral-500 data-[state=inactive]:hover:text-neutral-700",
                    )}
                  >
                    {label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <div className="bg-white rounded-b-xl border-x border-b border-neutral-200 p-6">
                {/* Info tab */}
                <Tabs.Content value="info">
                  <form
                    onSubmit={(e) => { e.preventDefault(); updateInfo.mutate(); }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Prénom</FieldLabel>
                        <input
                          value={profile?.firstName ?? ""}
                          readOnly
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <FieldLabel>Nom</FieldLabel>
                        <input
                          value={profile?.lastName ?? ""}
                          readOnly
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>CIN</FieldLabel>
                      <input
                        value={profile?.cin ?? ""}
                        readOnly
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                      />
                    </div>
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      label="Téléphone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <Input
                      label="Date de naissance"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                    <div>
                      <FieldLabel>Sexe</FieldLabel>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value as "M" | "F" | "OTHER" | "")}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">Non précisé</option>
                        <option value="M">Homme</option>
                        <option value="F">Femme</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    <Input
                      label="Ville"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      maxLength={100}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      loading={updateInfo.isPending}
                      iconLeft={<Save className="h-4 w-4" />}
                    >
                      Enregistrer
                    </Button>
                  </form>
                </Tabs.Content>

                {/* Health tab */}
                <Tabs.Content value="health">
                  <form
                    onSubmit={(e) => { e.preventDefault(); updateHealth.mutate(); }}
                    className="space-y-5"
                  >
                    <p className="rounded-lg bg-primary-50 border border-primary-100 p-3 text-xs text-primary-700">
                      Ces informations seront partagées avec le médecin pendant votre consultation pour un meilleur suivi.
                    </p>

                    <div>
                      <FieldLabel>Allergies connues</FieldLabel>
                      <TagInput values={allergies} onChange={setAllergies} placeholder="ex: Pénicilline, Arachides…" />
                    </div>
                    <div>
                      <FieldLabel>Antécédents médicaux</FieldLabel>
                      <TagInput values={conditions} onChange={setConditions} placeholder="ex: Hypertension, Diabète…" />
                    </div>
                    <div>
                      <FieldLabel>Médicaments actuels</FieldLabel>
                      <TagInput values={medications} onChange={setMedications} placeholder="ex: Metformine 500mg…" />
                    </div>
                    <div>
                      <FieldLabel>Groupe sanguin</FieldLabel>
                      <select
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">Non précisé</option>
                        {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Taille (cm)"
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        min={50}
                        max={250}
                        placeholder="170"
                      />
                      <Input
                        label="Poids (kg)"
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        min={1}
                        max={500}
                        placeholder="70"
                      />
                    </div>

                    <Button
                      type="submit"
                      fullWidth
                      loading={updateHealth.isPending}
                      iconLeft={<Save className="h-4 w-4" />}
                    >
                      Enregistrer
                    </Button>

                    {/* Quick links */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => router.push("/profile/sharing")}
                        className="w-full flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Share2 className="h-4 w-4 text-primary-500" />
                          Partage du dossier médical
                        </div>
                        <span className="text-neutral-400 text-xs">Gérer →</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/profile/referring-doctor")}
                        className="w-full flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-neutral-700">
                          <UserCheck className="h-4 w-4 text-primary-500" />
                          Médecin référent
                        </div>
                        <span className="text-neutral-400 text-xs">Gérer →</span>
                      </button>
                    </div>
                  </form>
                </Tabs.Content>

                {/* Security tab */}
                <Tabs.Content value="security">
                  <div className="space-y-6">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <h3 className="text-base font-semibold text-neutral-900">
                        Changer mon mot de passe
                      </h3>
                      <Input
                        label="Mot de passe actuel"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <Input
                        label="Nouveau mot de passe"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        helperText="Minimum 8 caractères"
                        required
                      />
                      <Input
                        label="Confirmer le nouveau mot de passe"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />

                      {pwError && (
                        <div className="flex items-center gap-2 rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-700">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          {pwError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        fullWidth
                        loading={updatePassword.isPending}
                      >
                        Changer le mot de passe
                      </Button>
                    </form>

                    <div className="border-t border-neutral-100 pt-5">
                      <h3 className="text-base font-semibold text-neutral-900">Sessions actives</h3>
                      <p className="mt-2 text-sm text-neutral-400">Bientôt disponible</p>
                    </div>

                    <div className="border-t border-neutral-100 pt-5">
                      <h3 className="text-base font-semibold text-error-700">Supprimer mon compte</h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        Cette action est irréversible. Toutes vos données seront supprimées.
                      </p>
                      <button
                        disabled
                        className="mt-3 w-full rounded-lg border border-error-200 py-2.5 text-sm text-error-400 cursor-not-allowed"
                      >
                        Supprimer — Contacter le support
                      </button>
                    </div>
                  </div>
                </Tabs.Content>
              </div>
            </Tabs.Root>
          </>
        )}
      </main>

      <BottomNav />
      {showSharingModal && (
        <SharingConsentModal onClose={() => setShowSharingModal(false)} />
      )}
    </div>
  );
}
