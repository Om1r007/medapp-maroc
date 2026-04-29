import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand/5 to-white">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-5xl font-bold text-brand-dark">
          Medapp Maroc 🇲🇦
        </h1>
        <p className="mt-4 text-xl text-gray-700">
          Consultez un médecin généraliste en ligne, en moins de 15 minutes.
        </p>

        <div className="mt-12 flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-brand px-6 py-3 font-medium text-brand hover:bg-brand/5"
          >
            Créer un compte
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Feature
            title="Rapide"
            text="Consultation en moins de 15 minutes"
          />
          <Feature
            title="Sécurisé"
            text="Vos données sont chiffrées et protégées"
          />
          <Feature
            title="Pratique"
            text="Depuis chez vous, à toute heure"
          />
        </div>
      </div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  );
}
