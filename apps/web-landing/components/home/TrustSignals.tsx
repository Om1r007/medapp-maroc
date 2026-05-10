import { CheckCircle2 } from "lucide-react";
import { SectionTitle } from "@/components/shared/SectionTitle";

const signals = [
  {
    title: "Conforme CNDP (loi 09-08)",
    description: "Protection des données personnelles conforme à la législation marocaine.",
  },
  {
    title: "Médecins inscrits à l'Ordre",
    description: "Tous nos médecins sont vérifiés et inscrits à l'Ordre des Médecins du Maroc.",
  },
  {
    title: "Hébergement données santé",
    description: "Vos données médicales sont stockées sur des serveurs sécurisés et chiffrés.",
  },
  {
    title: "Paiement sécurisé CMI",
    description: "Transactions sécurisées via le réseau CMI (Centre Monétique Interbancaire).",
  },
  {
    title: "Garantie remboursement",
    description: "Remboursement intégral automatique si aucun médecin disponible sous 15 minutes.",
  },
];

export function TrustSignals() {
  return (
    <section className="py-20 sm:py-28 bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Conformité & qualité"
          title="Notre engagement qualité"
          center
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signals.map((signal) => (
            <div key={signal.title} className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-neutral-50">
              <CheckCircle2 className="h-5 w-5 text-success-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{signal.title}</p>
                <p className="mt-0.5 text-xs text-neutral-600">{signal.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
