"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { SectionTitle } from "@/components/shared/SectionTitle";

const faqs = [
  {
    q: "Comment fonctionne la téléconsultation ?",
    a: "Vous payez 150 MAD, vous remplissez 60 secondes de pré-consultation, le premier médecin disponible vous prend en charge en visioconférence. À la fin, vous recevez votre compte-rendu, ordonnance et reçu en PDF.",
  },
  {
    q: "Que se passe-t-il si aucun médecin n'est disponible ?",
    a: "Si aucun médecin ne vous prend en charge dans les 15 minutes, vous êtes automatiquement remboursé intégralement. Aucune démarche de votre côté.",
  },
  {
    q: "Mes données médicales sont-elles sécurisées ?",
    a: "Oui. Medapp est conforme à la loi 09-08 (CNDP) du Maroc. Vos données sont chiffrées, hébergées sur des serveurs sécurisés, et soumises au secret médical.",
  },
  {
    q: "Puis-je obtenir une ordonnance ?",
    a: "Oui. Si le médecin le juge nécessaire, il vous délivre une ordonnance valable dans toutes les pharmacies du Maroc, téléchargeable immédiatement après la consultation.",
  },
  {
    q: "Pour quels motifs puis-je consulter ?",
    a: "Médecine générale principalement : symptômes ORL (rhume, mal de gorge), troubles digestifs, douleurs articulaires, fatigue, anxiété, infections urinaires, allergies, renouvellement d'ordonnance, etc. Pour une urgence vitale, appelez le 15 ou le 19.",
  },
];

export function FAQ() {
  return (
    <section className="py-20 sm:py-28 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Questions fréquentes"
          title="Tout ce que vous devez savoir"
          center
        />

        <Accordion.Root type="single" collapsible className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <Accordion.Item
              key={i}
              value={`item-${i}`}
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
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-[accordionDown_150ms_ease-out] data-[state=closed]:animate-[accordionUp_150ms_ease-out]">
                <div className="px-6 pb-5 pt-1 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
                  {faq.a}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        <p className="mt-8 text-center text-sm text-neutral-500">
          <Link href="/comment-ca-marche" className="text-primary-600 font-medium hover:underline underline-offset-4">
            Voir toutes les questions →
          </Link>
        </p>
      </div>
    </section>
  );
}
