import type { Metadata } from "next";
import { Heart, ShieldCheck, MapPin, Banknote } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Notre mission : rendre l'accès à un médecin de qualité simple, rapide et abordable au Maroc.",
};

const values = [
  {
    icon: Heart,
    title: "Qualité médicale absolue",
    description:
      "Chaque médecin sur Medapp est diplômé, vérifié et noté. Nous ne faisons pas de compromis sur la qualité des soins.",
  },
  {
    icon: Banknote,
    title: "Transparence des prix",
    description:
      "150 MAD. C'est le seul tarif. Pas d'abonnement, pas de frais cachés, pas de surprises. La transparence est une valeur fondamentale.",
  },
  {
    icon: ShieldCheck,
    title: "Protection des données",
    description:
      "Vos données médicales sont sacrées. Conformité CNDP totale, chiffrement systématique, secret médical garanti.",
  },
  {
    icon: MapPin,
    title: "Accessibilité géographique",
    description:
      "Un patient à Casablanca, Marrakech, Errachidia ou Nador mérite le même accès à un médecin de qualité. Medapp n'a pas de frontières géographiques.",
  },
];

export default function AProposPage() {
  return (
    <>
      <PageHero
        eyebrow="À propos"
        title="Notre mission"
        description="Rendre l'accès à un médecin de qualité simple, rapide et abordable au Maroc."
      />

      {/* Story */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionTitle
            eyebrow="Notre histoire"
            title="L'histoire de Medapp"
          />
          <div className="mt-8 space-y-4 text-sm text-neutral-700 leading-relaxed">
            <p>
              Medapp est née d&apos;un constat simple et douloureux : au Maroc, obtenir un rendez-vous avec un
              médecin généraliste prend en moyenne plusieurs jours. Dans les régions éloignées, c&apos;est parfois
              plusieurs semaines.
            </p>
            <p>
              Pendant ce temps, les marocains font face à des symptômes inquiétants sans pouvoir consulter
              rapidement, ou se retrouvent aux urgences pour des pathologies qui auraient pu être traitées
              en téléconsultation.
            </p>
            <p>
              La téléconsultation peut combler ce manque — à condition d&apos;être bien faite : avec de vrais
              médecins certifiés, un système technique fiable, et un tarif accessible.
            </p>
            <p>
              C&apos;est exactement ce que nous construisons avec Medapp.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Nos valeurs"
            title="Ce qui nous guide"
            center
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">{value.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionTitle
            eyebrow="L'équipe"
            title="Derrière Medapp"
          />
          <div className="mt-8 bg-white border border-neutral-200 rounded-xl p-8">
            <p className="text-sm text-neutral-700 leading-relaxed">
              Medapp est une initiative portée par une équipe de développeurs passionnés, en collaboration
              étroite avec des médecins partenaires marocains. Nous construisons Medapp de manière
              transparente, en priorisant la qualité médicale et la confiance des patients.
            </p>
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              Vous souhaitez nous rejoindre en tant que médecin, investisseur, ou partenaire ?{" "}
              <a href="/contact" className="text-primary-600 hover:underline underline-offset-4 font-medium">
                Contactez-nous →
              </a>
            </p>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
