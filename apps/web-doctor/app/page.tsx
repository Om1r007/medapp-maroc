import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">
          Espace praticien
        </p>
        <h1 className="mt-2 text-5xl font-bold text-brand-dark">
          Medapp — Médecins
        </h1>
        <p className="mt-4 text-xl text-gray-700">
          Consultez à distance vos patients depuis votre cabinet ou votre
          domicile. Gérez votre disponibilité en temps réel.
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
            S'inscrire (validation manuelle)
          </Link>
        </div>

        <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Important :</strong> votre inscription doit être validée
          manuellement après vérification de votre numéro d'inscription à
          l'Ordre National des Médecins.
        </div>
      </div>
    </main>
  );
}
