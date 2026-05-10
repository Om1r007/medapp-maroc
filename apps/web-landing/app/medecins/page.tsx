import type { Metadata } from "next";
import { Check, Laptop, Clock, Award, BarChart3 } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionTitle } from "@/components/shared/SectionTitle";

export const metadata: Metadata = {
  title: "Devenir médecin partenaire",
  description:
    "Rejoignez Medapp et augmentez vos revenus en pratiquant la téléconsultation. 80% de revenu par consultation, liberté totale sur vos horaires.",
};

const benefits = [
  {
    icon: BarChart3,
    title: "80% de revenu par consultation",
    description:
      "Vous percevez 120 MAD sur chaque consultation de 150 MAD. Paiement automatique mensuel, sans délai.",
  },
  {
    icon: Clock,
    title: "Liberté totale sur vos horaires",
    description:
      "Vous activez votre disponibilité quand vous le souhaitez. Pas d'engagement horaire minimum. Pas d'abonnement mensuel.",
  },
  {
    icon: Laptop,
    title: "Outils pro intégrés",
    description:
      "Dossier patient complet, prescription d'ordonnances, facturation automatisée, statistiques de vos consultations.",
  },
  {
    icon: Award,
    title: "Score qualité visible",
    description:
      "Votre note patient est votre meilleure vitrine. Les médecins les mieux notés obtiennent plus de consultations.",
  },
];

const profile = [
  "Diplôme de médecin généraliste ou spécialiste",
  "Inscrit à l'Ordre des Médecins du Maroc",
  "Expérience minimum 2 ans post-internat",
  "Ordinateur avec webcam + connexion internet stable",
  "Capacité à consulter en français et/ou en darija",
];

const steps = [
  {
    number: "01",
    title: "Inscription en ligne",
    description: "Remplissez le formulaire en 5 minutes. Documents requis : CIN, diplôme, numéro d'ordre.",
  },
  {
    number: "02",
    title: "Vérification des documents",
    description: "Notre équipe vérifie vos documents sous 24 à 48 heures ouvrées.",
  },
  {
    number: "03",
    title: "Onboarding personnalisé",
    description: "Session de prise en main de la plateforme d'une heure. Accès au dashboard médecin.",
  },
  {
    number: "04",
    title: "Première consultation",
    description: "Activez votre disponibilité et recevez vos premières consultations.",
  },
];

const doctorUrl = process.env.NEXT_PUBLIC_DOCTOR_APP_URL ?? "http://localhost:3001";

export default function MedecinsPage() {
  const consultationsPerDay = 5;
  const daysPerWeek = 5;
  const weeksPerMonth = 4;
  const ratePerConsultation = 150 * 0.8;
  const monthlyEarnings = consultationsPerDay * daysPerWeek * weeksPerMonth * ratePerConsultation;

  return (
    <>
      <PageHero
        eyebrow="Pour les médecins"
        title="Rejoignez Medapp"
        description="Augmentez vos revenus tout en gardant votre liberté. Consultez depuis chez vous, à votre rythme."
      >
        <div className="mt-6">
          <a
            href={`${doctorUrl}/signup`}
            className="inline-flex items-center justify-center h-12 px-8 bg-primary-500 text-white text-base font-semibold rounded-lg hover:bg-primary-600 transition-colors"
          >
            Postuler en 5 min →
          </a>
        </div>
      </PageHero>

      {/* Benefits */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Pourquoi nous rejoindre"
            title="Pourquoi rejoindre Medapp"
            center
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="bg-white border border-neutral-200 rounded-xl p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 mb-4">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Profile */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionTitle
            eyebrow="Profil recherché"
            title="Le profil que nous recherchons"
          />
          <ul className="mt-8 space-y-3">
            {profile.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                <Check className="h-4 w-4 text-success-600 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Processus"
            title="Comment ça se passe ?"
            center
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="bg-white border border-neutral-200 rounded-xl p-6">
                <span className="font-mono text-3xl font-bold text-primary-500">{step.number}</span>
                <h3 className="mt-4 text-base font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
          <SectionTitle
            eyebrow="Estimation de revenus"
            title="Combien puis-je gagner ?"
            center
          />
          <div className="mt-10 bg-primary-50 border border-primary-200 rounded-xl p-8">
            <p className="text-sm text-neutral-600 mb-2">
              Exemple : 5 consultations/jour · 5 jours/semaine
            </p>
            <p className="text-5xl font-bold text-neutral-900 mt-4">
              {monthlyEarnings.toLocaleString("fr-FR")} MAD
              <span className="text-xl font-normal text-neutral-500">/mois</span>
            </p>
            <p className="mt-3 text-xs text-neutral-500">
              Calcul : {consultationsPerDay} consult. × {daysPerWeek} jours × {weeksPerMonth} semaines × 120 MAD
            </p>
            <p className="mt-4 text-xs text-neutral-400">
              Estimation indicative. Vos revenus réels dépendent de votre disponibilité.
            </p>
          </div>
          <div className="mt-8">
            <a
              href={`${doctorUrl}/signup`}
              className="inline-flex items-center justify-center h-12 px-8 bg-primary-500 text-white text-base font-semibold rounded-lg hover:bg-primary-600 transition-colors"
            >
              Postuler maintenant →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
