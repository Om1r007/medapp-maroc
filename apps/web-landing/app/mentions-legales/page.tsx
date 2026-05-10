import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHero
        eyebrow="Légal"
        title="Mentions légales"
      />

      <section className="py-16 sm:py-20 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 prose prose-sm max-w-none text-neutral-700">
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8 not-prose">
              <p className="text-sm font-semibold text-warning-700">Document en cours de finalisation</p>
              <p className="text-xs text-warning-600 mt-1">Ce document doit être complété et validé par un avocat marocain avant la mise en production.</p>
            </div>

            <h2 className="text-base font-semibold text-neutral-900 mb-4">Identité de l&apos;éditeur</h2>
            <p>Medapp Maroc SARL</p>
            <p>Adresse : [À remplir avant prod]</p>
            <p>ICE : [À remplir]</p>
            <p>RC : [À remplir]</p>
            <p>IF : [À remplir]</p>
            <p>Email : <a href="mailto:contact@medapp.ma" className="text-primary-600 hover:underline">contact@medapp.ma</a></p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">Directeur de publication</h2>
            <p>[À remplir]</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">Hébergement</h2>
            <p>[Nom de l&apos;hébergeur — À remplir avant prod]</p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur le site medapp.ma (textes, images, logos, icônes) est la propriété
              exclusive de Medapp Maroc SARL, sauf mention contraire. Toute reproduction, même partielle, est interdite
              sans autorisation préalable.
            </p>

            <h2 className="text-base font-semibold text-neutral-900 mt-8 mb-4">Données personnelles</h2>
            <p>
              Conformément à la loi 09-08 relative à la protection des personnes physiques à l&apos;égard du traitement
              des données à caractère personnel, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression
              de vos données. Pour exercer ce droit, contactez : privacy@medapp.ma.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
