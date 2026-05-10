import { SectionTitle } from "@/components/shared/SectionTitle";

const steps = [
  {
    number: "01",
    title: "Décrivez vos symptômes",
    description:
      "Une pré-consultation guidée de 60 secondes pour transmettre votre dossier médical au médecin.",
  },
  {
    number: "02",
    title: "Un médecin disponible vous prend en charge",
    description:
      "Le premier médecin certifié disponible vous reçoit. Tous nos médecins sont inscrits à l'Ordre des Médecins du Maroc.",
  },
  {
    number: "03",
    title: "Consultation vidéo + documents",
    description:
      "Consultation par visioconférence sécurisée. Compte-rendu, ordonnance et reçu téléchargeables immédiatement.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Simple et rapide"
          title="Comment ça marche"
          description="En 3 étapes simples, vous parlez à un médecin."
          center
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line between steps */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-7 left-1/2 w-full h-px bg-neutral-200" aria-hidden />
              )}
              <div className="relative bg-white border border-neutral-200 rounded-xl p-6">
                <span className="font-mono text-3xl font-bold text-primary-500 leading-none">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900 leading-snug">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
