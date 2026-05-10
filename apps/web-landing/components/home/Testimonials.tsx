const patientUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL ?? "http://localhost:3000";

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
          Prochainement
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
          Bientôt, vos témoignages
        </h2>
        <p className="mt-4 text-lg text-neutral-600 max-w-xl mx-auto">
          Medapp ouvre ses portes aux premiers patients. Soyez parmi les premiers à tester et nous
          partager votre expérience.
        </p>
        <div className="mt-8">
          <a
            href={`${patientUrl}/signup`}
            className="inline-flex items-center justify-center h-12 px-8 bg-primary-500 text-white text-base font-semibold rounded-lg hover:bg-primary-600 transition-colors"
          >
            Devenir testeur bêta →
          </a>
        </div>
      </div>
    </section>
  );
}
