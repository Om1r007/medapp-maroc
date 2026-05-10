import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  robots: { index: false },
};

export default function CguPage() {
  return (
    <>
      <PageHero
        eyebrow="Légal"
        title="Conditions Générales d'Utilisation"
      />

      <section className="py-16 sm:py-20 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 prose prose-sm max-w-none text-neutral-700">
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8 not-prose">
              <p className="text-sm font-semibold text-warning-700">Document en cours de finalisation</p>
              <p className="text-xs text-warning-600 mt-1">Les CGU doivent être rédigées et validées par un avocat marocain spécialisé en droit numérique et médical avant la mise en production.</p>
            </div>

            <p className="text-sm text-neutral-500 mb-8">Version : [À remplir] — Date d&apos;entrée en vigueur : [À remplir]</p>

            <h2 className="text-base font-semibold text-neutral-900 mb-4">1. Objet</h2>
            <p>Les présentes Conditions Générales d&apos;Utilisation régissent l&apos;accès et l&apos;utilisation de la plateforme Medapp accessible sur medapp.ma et via l&apos;application web app.medapp.ma.</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">2. Acceptation</h2>
            <p>L&apos;utilisation de Medapp implique l&apos;acceptation pleine et entière des présentes CGU.</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">3. Description du service</h2>
            <p>Medapp est une plateforme de téléconsultation médicale permettant aux patients de consulter des médecins certifiés par vidéoconférence.</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">4. Conditions d&apos;utilisation</h2>
            <p>[À détailler — âge minimum, usage personnel, interdictions…]</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">5. Tarifs et paiements</h2>
            <p>[À détailler — politique de remboursement, méthodes de paiement…]</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">6. Responsabilité</h2>
            <p>[À détailler avec un avocat — responsabilité médicale, technique…]</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">7. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit marocain. En cas de litige, les tribunaux compétents de [Ville] seront seuls compétents.</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">8. Contact</h2>
            <p>contact@medapp.ma</p>
          </div>
        </div>
      </section>
    </>
  );
}
