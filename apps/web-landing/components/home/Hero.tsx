const patientUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL ?? "http://localhost:3000";
const doctorUrl = process.env.NEXT_PUBLIC_DOCTOR_APP_URL ?? "http://localhost:3001";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-50 opacity-60" />
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-primary-100 opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
            Bientôt disponible · Bêta en cours
          </p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 leading-none tracking-tight">
            Un médecin disponible en moins de 15 minutes.
          </h1>

          <p className="mt-6 text-xl text-neutral-600 leading-relaxed max-w-xl">
            Sans rendez-vous, à toute heure. Médecins certifiés inscrits à l&apos;Ordre des Médecins du Maroc.{" "}
            <span className="font-semibold text-neutral-900">150 MAD</span> par consultation, sans frais cachés.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
            <a
              href={`${patientUrl}/consultations/new`}
              className="inline-flex items-center justify-center h-14 px-8 bg-primary-500 text-white text-base font-semibold rounded-lg hover:bg-primary-600 transition-colors w-full sm:w-auto"
            >
              Consulter maintenant →
            </a>
            <a
              href={doctorUrl}
              className="inline-flex items-center justify-center h-14 px-8 bg-white text-neutral-900 text-base font-semibold rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors w-full sm:w-auto"
            >
              Espace médecin
            </a>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-sm text-neutral-500 flex items-center gap-2">
            <span>⭐ Note moyenne 4.9/5</span>
            <span className="text-neutral-300">·</span>
            <span>50+ médecins en cours de recrutement</span>
            <span className="text-neutral-300">·</span>
            <span>Disponible dans tout le Maroc</span>
          </p>
        </div>
      </div>
    </section>
  );
}
