import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <>
      <PageHero
        eyebrow="Légal"
        title="Politique de confidentialité"
      />

      <section className="py-16 sm:py-20 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 prose prose-sm max-w-none text-neutral-700">
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8 not-prose">
              <p className="text-sm font-semibold text-warning-700">Document en cours de finalisation</p>
              <p className="text-xs text-warning-600 mt-1">Ce document doit être rédigé et validé par un avocat spécialisé en droit des données marocain avant la mise en production.</p>
            </div>

            <p className="text-sm text-neutral-500 mb-8">Dernière mise à jour : [Date à remplir]</p>

            <h2 className="text-base font-semibold text-neutral-900 mb-4">1. Responsable du traitement</h2>
            <p>Medapp Maroc SARL — contact@medapp.ma</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">2. Données collectées</h2>
            <p>
              Medapp collecte les données suivantes : informations d&apos;identification (nom, prénom, email, téléphone),
              données de santé (symptômes, antécédents, médicaments, comptes-rendus), données de paiement (traitées
              par un prestataire certifié — Medapp ne stocke pas vos données bancaires).
            </p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">3. Finalités du traitement</h2>
            <p>Vos données sont utilisées pour : fournir le service de téléconsultation, assurer le suivi médical, traiter les paiements, améliorer la qualité du service.</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">4. Base légale</h2>
            <p>Le traitement est fondé sur votre consentement explicite lors de l&apos;inscription et l&apos;exécution du contrat de service.</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">5. Durée de conservation</h2>
            <p>Données médicales : 10 ans conformément à la réglementation marocaine. Données de compte : 3 ans après la dernière activité.</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">6. Vos droits</h2>
            <p>Accès, rectification, effacement, portabilité. Contact : privacy@medapp.ma</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">7. Contact CNDP</h2>
            <p>Commission Nationale de Contrôle de la Protection des Données à Caractère Personnel (CNDP) — Maroc.</p>
          </div>
        </div>
      </section>
    </>
  );
}
