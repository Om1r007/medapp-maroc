import { Clock, ShieldCheck, FileText, Wallet } from "lucide-react";
import { SectionTitle } from "@/components/shared/SectionTitle";

const features = [
  {
    icon: Clock,
    title: "En moins de 15 minutes",
    description:
      "Sans rendez-vous, disponible 7j/7 jusqu'à 23h. Plus besoin d'attendre des semaines pour un créneau.",
  },
  {
    icon: ShieldCheck,
    title: "Standard qualité Medapp",
    description:
      "Tous nos médecins sont diplômés, inscrits à l'Ordre des Médecins du Maroc, et notés en continu par les patients.",
  },
  {
    icon: FileText,
    title: "Dossier médical unifié",
    description:
      "Votre dossier vous suit entre tous nos médecins. Plus besoin de tout réexpliquer à chaque consultation.",
  },
  {
    icon: Wallet,
    title: "150 MAD, sans surprise",
    description:
      "Tarif unique transparent. Vous êtes automatiquement remboursé si aucun médecin n'est disponible sous 15 minutes.",
  },
];

export function Features() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Nos avantages"
          title="Pourquoi choisir Medapp"
          center
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 hover:shadow-sm transition-all duration-150"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 mb-4">
                  <Icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
