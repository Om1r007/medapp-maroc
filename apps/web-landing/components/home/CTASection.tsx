import Link from "next/link";

const patientUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL ?? "http://localhost:3000";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-primary-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
          Prêt à consulter un médecin ?
        </h2>
        <p className="mt-4 text-lg text-primary-100">
          150 MAD · Sans rendez-vous · Sous 15 minutes
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`${patientUrl}/consultations/new`}
            className="inline-flex items-center justify-center h-14 px-8 bg-white text-primary-600 text-base font-semibold rounded-lg hover:bg-primary-50 transition-colors w-full sm:w-auto"
          >
            Consulter maintenant →
          </a>
        </div>
        <p className="mt-5 text-sm text-primary-200">
          Vous êtes médecin ?{" "}
          <Link href="/medecins" className="font-semibold text-white hover:underline underline-offset-4">
            Rejoindre Medapp →
          </Link>
        </p>
      </div>
    </section>
  );
}
