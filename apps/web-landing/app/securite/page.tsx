import type { Metadata } from "next";
import { Shield, Lock, Server, FileText, Mail } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "Sécurité & confidentialité",
  description:
    "Medapp est conforme à la loi 09-08 (CNDP) et à la loi 131-13. Vos données médicales sont chiffrées, sécurisées et soumises au secret médical.",
};

const legal = [
  {
    icon: Shield,
    title: "Loi 09-08 — Protection des données personnelles (CNDP)",
    description:
      "Medapp est conforme à la loi marocaine 09-08 sur la protection des personnes physiques à l'égard du traitement des données à caractère personnel. Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.",
  },
  {
    icon: FileText,
    title: "Loi 131-13 — Exercice de la médecine",
    description:
      "Tous nos médecins exercent dans le respect de la loi 131-13 encadrant l'exercice de la médecine au Maroc et les téléconsultations. Le code de déontologie médicale marocain est applicable à chaque consultation.",
  },
  {
    icon: Shield,
    title: "Code de déontologie médicale",
    description:
      "Le secret médical est garanti. Vos informations médicales ne peuvent être divulguées qu'avec votre consentement explicite, sauf obligations légales.",
  },
];

const technical = [
  {
    icon: Lock,
    title: "Chiffrement TLS 1.3",
    description: "Toutes les communications entre votre navigateur et nos serveurs sont chiffrées via TLS 1.3, le protocole de sécurité le plus moderne.",
  },
  {
    icon: Server,
    title: "Hébergement sécurisé",
    description: "Vos données sont hébergées sur des serveurs sécurisés avec accès restreint. Sauvegardes quotidiennes chiffrées.",
  },
  {
    icon: Lock,
    title: "Données médicales chiffrées",
    description: "Vos dossiers médicaux sont chiffrés au repos et en transit. Seuls les médecins que vous consultez y ont accès.",
  },
  {
    icon: Shield,
    title: "Vidéo sécurisée",
    description: "Les consultations vidéo sont chiffrées de bout en bout. Aucun enregistrement vidéo n'est conservé.",
  },
];

const rights = [
  {
    title: "Droit d'accès",
    description: "Vous pouvez à tout moment demander une copie de toutes les données que Medapp détient vous concernant.",
  },
  {
    title: "Droit de rectification",
    description: "Vous pouvez corriger vos données personnelles directement depuis votre espace patient ou en contactant notre support.",
  },
  {
    title: "Droit à l'effacement",
    description: "Vous pouvez demander la suppression de votre compte et de vos données personnelles. Les données médicales sont conservées 10 ans conformément à la réglementation.",
  },
  {
    title: "Droit à la portabilité",
    description: "Vous pouvez récupérer vos données dans un format structuré et lisible par machine (JSON/PDF).",
  },
  {
    title: "Comment exercer vos droits",
    description: "Envoyez votre demande à privacy@medapp.ma avec une copie de votre pièce d'identité. Réponse garantie sous 30 jours.",
  },
];

export default function SecuritePage() {
  return (
    <>
      <PageHero
        eyebrow="Sécurité"
        title="Vos données médicales protégées"
        description="La protection de vos données de santé est une responsabilité que nous prenons très au sérieux. Voici comment nous la garantissons."
      />

      {/* Legal compliance */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Conformité légale"
            title="Cadre légal marocain"
            description="Medapp opère dans le respect total du cadre légal marocain applicable à la télémédecine."
          />
          <div className="mt-14 space-y-4">
            {legal.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white border border-neutral-200 rounded-xl p-6 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical security */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Sécurité technique"
            title="Mesures de sécurité"
            center
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {technical.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 mb-3">
                    <Icon className="h-4 w-4 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* User rights */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionTitle
            eyebrow="Vos droits"
            title="Vos droits sur vos données"
          />
          <div className="mt-10 space-y-4">
            {rights.map((right) => (
              <div key={right.title} className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-neutral-900">{right.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{right.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-primary-50 border border-primary-200 rounded-xl p-6 flex items-start gap-4">
            <Mail className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Contact DPO Medapp</p>
              <p className="mt-1 text-sm text-neutral-600">
                Pour toute question relative à vos données personnelles :{" "}
                <a href="mailto:privacy@medapp.ma" className="text-primary-600 hover:underline underline-offset-4">
                  privacy@medapp.ma
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
