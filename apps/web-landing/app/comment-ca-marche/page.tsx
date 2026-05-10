"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, CreditCard, ClipboardList, Video, FileDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { PageHero } from "@/components/shared/PageHero";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { CTASection } from "@/components/home/CTASection";

const patientSteps = [
  {
    icon: CreditCard,
    title: "Vous payez la consultation",
    description:
      "150 MAD par carte bancaire (CMI, Visa, Mastercard). Paiement 100% sécurisé. Remboursement automatique si aucun médecin disponible sous 15 minutes.",
  },
  {
    icon: ClipboardList,
    title: "Pré-consultation guidée",
    description:
      "En 60 secondes, vous décrivez vos symptômes, vos antécédents et vos médicaments en cours. Ces informations sont transmises au médecin avant même qu'il vous appelle.",
  },
  {
    icon: Video,
    title: "File d'attente",
    description:
      "Vous entrez dans la file d'attente. Le premier médecin certifié disponible vous est attribué. Temps d'attente moyen : moins de 15 minutes.",
  },
  {
    icon: Video,
    title: "Consultation en vidéo",
    description:
      "Consultation par visioconférence sécurisée, directement dans votre navigateur. Durée typique : 15 à 30 minutes.",
  },
  {
    icon: FileDown,
    title: "Compte-rendu médical",
    description:
      "À l'issue de la consultation, le médecin rédige son compte-rendu. Vous recevez immédiatement : compte-rendu médical PDF, ordonnance PDF (si nécessaire), reçu de paiement PDF.",
  },
  {
    icon: ClipboardList,
    title: "Dossier médical mis à jour",
    description:
      "Chaque consultation enrichit votre dossier médical Medapp. À votre prochaine consultation, le médecin aura accès à votre historique complet.",
  },
];

const commitments = [
  {
    title: "Qualité médicale",
    items: [
      "Tous les médecins sont diplômés et inscrits à l'Ordre des Médecins du Maroc",
      "Vérification systématique des diplômes et du numéro d'ordre",
      "Notation continue par les patients après chaque consultation",
      "Score qualité visible sur le profil de chaque médecin",
    ],
  },
  {
    title: "Sécurité & confidentialité",
    items: [
      "Conforme à la loi 09-08 (CNDP) — Protection des données personnelles",
      "Chiffrement TLS 1.3 de toutes les communications",
      "Secret médical garanti — vos données ne sont jamais vendues",
      "Hébergement sécurisé sur serveurs dédiés",
    ],
  },
  {
    title: "Transparence",
    items: [
      "Tarif unique 150 MAD — aucun frais caché",
      "Remboursement automatique et intégral si aucun médecin disponible",
      "Vous savez exactement qui vous consulte (photo, spécialité, expérience)",
      "Compte-rendu systématique après chaque consultation",
    ],
  },
];

const faqExtended = [
  {
    q: "La téléconsultation est-elle légale au Maroc ?",
    a: "Oui. La loi 131-13 encadre la médecine au Maroc et permet la téléconsultation. Medapp opère en conformité totale avec cette réglementation et le code de déontologie médicale marocain.",
  },
  {
    q: "Quels médecins puis-je consulter ?",
    a: "Actuellement des médecins généralistes. Les spécialités (dermatologie, pédiatrie, gynécologie…) seront disponibles en V2.",
  },
  {
    q: "Puis-je consulter pour un enfant ?",
    a: "Oui, le représentant légal peut consulter pour un mineur. Précisez-le lors de la pré-consultation.",
  },
  {
    q: "La consultation se passe-t-elle toujours en français ?",
    a: "Nos médecins consultent en français et/ou en darija. Précisez votre préférence lors de la pré-consultation.",
  },
  {
    q: "Et si j'ai besoin d'une urgence ?",
    a: "Medapp n'est pas un service d'urgences. En cas d'urgence vitale, appelez le 15 (SAMU) ou le 19 (Pompiers). Pour des symptômes non urgents qui ne nécessitent pas de déplacement immédiat, Medapp est approprié.",
  },
  {
    q: "Est-ce que Medapp remplace mon médecin habituel ?",
    a: "Non. Medapp est complémentaire à votre suivi médical habituel. Idéal pour des consultations ponctuelles, le renouvellement d'ordonnances, et les questions médicales courantes.",
  },
  {
    q: "Comment sont choisis les médecins ?",
    a: "Chaque médecin passe par une vérification rigoureuse : diplôme, numéro d'ordre, pièce d'identité, et entretien de qualification. Nous vérifions systématiquement l'inscription à l'Ordre des Médecins du Maroc.",
  },
  {
    q: "Puis-je choisir mon médecin ?",
    a: "Pour garantir un temps d'attente inférieur à 15 minutes, le système vous attribue le premier médecin disponible qualifié. Le choix du médecin sera possible en V2.",
  },
  {
    q: "Comment accéder à mes ordonnances et documents ?",
    a: "Immédiatement après la consultation, vous recevez par email et dans votre espace patient les PDFs : compte-rendu, ordonnance (si prescrite), reçu. Ils sont téléchargeables à tout moment.",
  },
  {
    q: "Les pharmacies acceptent-elles les ordonnances Medapp ?",
    a: "Oui. Les ordonnances sont rédigées par des médecins diplômés inscrits à l'Ordre, avec leur tampon et signature. Elles ont la même valeur légale qu'une ordonnance en cabinet.",
  },
  {
    q: "Que faire si je ne suis pas satisfait de ma consultation ?",
    a: "Contactez notre support à contact@medapp.ma. Nous examinons chaque réclamation sérieusement. En cas de manquement prouvé aux standards de qualité, un remboursement peut être accordé au cas par cas.",
  },
  {
    q: "Puis-je consulter depuis l'étranger ?",
    a: "Techniquement oui, mais les ordonnances sont valables au Maroc uniquement. Le paiement doit être effectué avec une carte bancaire marocaine (CMI, Visa, Mastercard internationale acceptée).",
  },
  {
    q: "Combien de temps dure une consultation ?",
    a: "En général 15 à 30 minutes selon le motif. Le médecin peut prolonger si nécessaire, sans surcoût.",
  },
  {
    q: "Y a-t-il un abonnement ou un forfait ?",
    a: "Non. Medapp est 100% à la consultation. Vous payez uniquement quand vous consultez. Aucun abonnement mensuel.",
  },
  {
    q: "Puis-je annuler ma consultation ?",
    a: "Avant d'être pris en charge par un médecin, vous pouvez annuler et être remboursé. Une fois la consultation commencée, le remboursement n'est plus possible sauf cas exceptionnel.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <>
      <PageHero
        eyebrow="Comment ça marche"
        title="Comment fonctionne Medapp"
        description="De la demande de consultation à la réception de vos documents — tout le parcours expliqué étape par étape."
      />

      {/* Patient journey */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Parcours patient"
            title="Le parcours patient en détail"
            description="Du premier clic à la réception de vos documents médicaux."
          />

          <div className="mt-14 relative">
            <div className="hidden md:block absolute left-5 top-6 bottom-6 w-px bg-neutral-200" aria-hidden />
            <div className="space-y-6 md:pl-16">
              {patientSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative">
                    <div className="hidden md:flex absolute -left-16 top-5 h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-primary-500">
                      <span className="text-xs font-bold text-primary-600">{i + 1}</span>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900">{step.title}</h3>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Nos engagements"
            title="Les engagements Medapp"
            center
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {commitments.map((commitment) => (
              <div key={commitment.title} className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                <h3 className="text-base font-semibold text-neutral-900 mb-4">{commitment.title}</h3>
                <ul className="space-y-2">
                  {commitment.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-neutral-600">
                      <span className="text-success-600 mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extended FAQ */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="FAQ complète"
            title="Toutes vos questions"
            center
          />
          <Accordion.Root type="single" collapsible className="mt-12 space-y-3">
            {faqExtended.map((faq, i) => (
              <Accordion.Item
                key={i}
                value={`faq-${i}`}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors">
                    {faq.q}
                    <ChevronDown className={cn(
                      "h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200",
                      "group-data-[state=open]:rotate-180",
                    )} />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  <div className="px-6 pb-5 pt-1 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
                    {faq.a}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

      <CTASection />
    </>
  );
}
