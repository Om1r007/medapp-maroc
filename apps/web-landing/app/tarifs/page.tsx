import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Un tarif unique et transparent : 150 MAD par consultation. Compte-rendu, ordonnance et reçu inclus. Remboursement automatique si indisponibilité.",
};

const included = [
  "Consultation vidéo avec médecin certifié (jusqu'à 30 min)",
  "Compte-rendu médical PDF",
  "Ordonnance PDF si nécessaire",
  "Reçu de paiement PDF",
  "Dossier médical conservé sur Medapp",
  "Remboursement automatique si aucun médecin disponible",
];

const excluded = [
  "Médicaments (à acheter en pharmacie)",
  "Examens complémentaires (analyses, imagerie)",
  "Consultations spécialisées (V2 — bientôt)",
  "Suivi long terme et maladies chroniques (V2)",
];

const comparison = [
  { label: "Délai d'attente", medapp: "< 15 minutes", cabinet: "1 à 3 semaines" },
  { label: "Disponibilité", medapp: "7j/7, jusqu'à 23h", cabinet: "Horaires de bureau" },
  { label: "Déplacement", medapp: "Aucun", cabinet: "Requis" },
  { label: "Tarif", medapp: "150 MAD", cabinet: "150–300 MAD" },
  { label: "Compte-rendu", medapp: "Immédiat (PDF)", cabinet: "Variable" },
  { label: "Ordonnance", medapp: "Immédiate (PDF)", cabinet: "Sur place" },
  { label: "Dossier médical", medapp: "Unifié, accessible en ligne", cabinet: "Par cabinet" },
];

export default function TarifsPage() {
  return (
    <>
      <PageHero
        eyebrow="Tarifs"
        title="Un tarif unique, sans surprise"
        description="150 MAD par consultation. C'est tout. Aucun abonnement, aucun frais caché, aucune surprise."
      />

      {/* Price card */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-white border-2 border-primary-500 rounded-xl overflow-hidden">
            <div className="bg-primary-500 px-8 py-6 text-center">
              <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider">Consultation</p>
              <p className="mt-2 text-5xl font-bold text-white">150 <span className="text-3xl">MAD</span></p>
              <p className="mt-1 text-primary-200 text-sm">par consultation · sans abonnement</p>
            </div>
            <div className="px-8 py-6">
              <p className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wider">Inclus dans votre consultation :</p>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                    <Check className="h-4 w-4 text-success-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <hr className="my-6 border-neutral-200" />

              <p className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wider">Non inclus :</p>
              <ul className="space-y-3">
                {excluded.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-neutral-500">
                    <X className="h-4 w-4 text-neutral-300 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <a
                  href={`${process.env.NEXT_PUBLIC_PATIENT_APP_URL ?? "http://localhost:3000"}/consultations/new`}
                  className="flex items-center justify-center h-12 px-6 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors w-full"
                >
                  Consulter maintenant →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionTitle
            eyebrow="Comparaison"
            title="Medapp vs cabinet médical libéral"
            description="Un outil de comparaison honnête. Chaque solution a ses avantages."
            center
          />

          <div className="mt-10 overflow-hidden border border-neutral-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-semibold text-neutral-900"></th>
                  <th className="px-4 py-3 text-center font-semibold text-primary-600">Medapp</th>
                  <th className="px-4 py-3 text-center font-semibold text-neutral-600">Cabinet libéral</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                    <td className="px-4 py-3 text-neutral-600">{row.label}</td>
                    <td className="px-4 py-3 text-center font-medium text-neutral-900">{row.medapp}</td>
                    <td className="px-4 py-3 text-center text-neutral-500">{row.cabinet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Refund policy */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionTitle
            eyebrow="Politique de remboursement"
            title="Garantie de disponibilité"
          />
          <div className="mt-8 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-2">Remboursement automatique (15 minutes)</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Si aucun médecin ne vous prend en charge dans les 15 minutes suivant votre paiement,
                vous êtes automatiquement et intégralement remboursé. Aucune démarche de votre côté.
                Le délai de réception sur votre compte dépend de votre banque (généralement 3 à 5 jours ouvrés).
              </p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-2">Annulation avant prise en charge</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Si vous annulez votre demande avant d'être pris en charge par un médecin, vous êtes
                remboursé intégralement.
              </p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-2">Mode de paiement</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Cartes bancaires marocaines (CMI), Visa et Mastercard internationaux acceptés.
                Paiement sécurisé. Aucune donnée bancaire stockée par Medapp.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
