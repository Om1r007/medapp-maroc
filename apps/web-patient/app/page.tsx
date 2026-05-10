import Link from "next/link";
import { CheckCircle, Clock, Shield, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* TopBar */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 h-16">
        <div className="mx-auto max-w-7xl px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-neutral-900 text-sm tracking-tight">
              Medapp
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-wider font-medium text-primary-600 mb-4">
            Téléconsultation au Maroc
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 leading-none">
            Consultez un médecin
            <br />
            <span className="text-primary-500">en moins de 15 min</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-500 max-w-xl">
            Sans rendez-vous, à toute heure. Médecins certifiés par
            l&apos;Ordre National des Médecins du Maroc. 150 MAD.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Consulter maintenant
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-lg bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              Se connecter
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
              <span className="font-medium text-neutral-900">4.9</span>
              <span>/5 satisfaction</span>
            </div>
            <div className="h-4 w-px bg-neutral-200" />
            <span>12&nbsp;000+ consultations</span>
            <div className="h-4 w-px bg-neutral-200" />
            <span>50+ médecins certifiés</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-neutral-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-wider font-medium text-neutral-500 mb-3">
              Simple et rapide
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
              Comment ca marche
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Decrivez vos symptomes",
                desc: "Remplissez un bref questionnaire de pre-consultation en moins de 2 minutes.",
              },
              {
                step: "02",
                title: "Medecin trouve en moins de 15 min",
                desc: "Notre systeme vous met en relation avec le premier medecin disponible certifie.",
              },
              {
                step: "03",
                title: "Consultation video + ordonnance",
                desc: "Consultez en video securisee et recevez votre ordonnance numerique immediatement.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="bg-white border border-neutral-200 rounded-xl p-6"
              >
                <p className="text-4xl font-bold text-neutral-200 mb-4 tracking-tight">
                  {step}
                </p>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-wider font-medium text-neutral-500 mb-3">
              Pourquoi Medapp
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
              La medecine a la hauteur de vos attentes
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Standard qualite garanti",
                desc: "Score moyen 4.7/5. Chaque medecin est evalue apres chaque consultation. En dessous de 4/5 sur 20 avis, le praticien est suspendu.",
              },
              {
                title: "Dossier medical unifie",
                desc: "Avec votre accord, vos antecedents sont partagees entre medecins Medapp pour un meilleur suivi, conforme a la loi 09-08 (CNDP).",
              },
              {
                title: "Sans rendez-vous",
                desc: "Disponible 7j/7, de 8h a minuit. Pas de delai d'attente pour obtenir un creneau, juste la file d'attente en temps reel.",
              },
              {
                title: "150 MAD — prix unique",
                desc: "Tarif transparent, sans frais caches. Remboursement integral automatique si aucun medecin n'est disponible sous 15 minutes.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="border border-neutral-200 rounded-xl p-6"
              >
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-neutral-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
              Ce que disent nos patients
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Fatima Z.",
                city: "Casablanca",
                stars: 5,
                text: "Medecin disponible en 8 minutes un dimanche soir. Diagnostic clair, ordonnance recue immediatement. Exactement ce dont j'avais besoin.",
              },
              {
                name: "Youssef M.",
                city: "Rabat",
                stars: 5,
                text: "Interface claire, paiement rapide, video de bonne qualite. Le medecin a pris le temps d'expliquer. Je recommande vivement.",
              },
              {
                name: "Nadia B.",
                city: "Marrakech",
                stars: 5,
                text: "J'utilise Medapp pour toute ma famille. Pratique, abordable, et les medecins sont vraiment professionnels.",
              },
            ].map(({ name, city, stars, text }) => (
              <div
                key={name}
                className="bg-white border border-neutral-200 rounded-xl p-6"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />
                  ))}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed mb-4">
                  &ldquo;{text}&rdquo;
                </p>
                <p className="text-xs font-semibold text-neutral-900">
                  {name} <span className="font-normal text-neutral-400">— {city}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-neutral-900">
              Notre engagement qualite
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {[
              "Conforme CNDP (Loi 09-08)",
              "Medecins inscrits Ordre Maroc",
              "Hebergement donnees sante",
              "Paiement securise CMI",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-500 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Pret a consulter ?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Premiere consultation en moins de 15 minutes, garantie.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-lg bg-white text-primary-600 hover:bg-primary-50 transition-colors"
          >
            Commencer maintenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="font-semibold text-neutral-900 text-sm">Medapp</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-neutral-500">
              <Link href="/login" className="hover:text-neutral-900 transition-colors">
                Espace patient
              </Link>
              <a href="http://localhost:3001" className="hover:text-neutral-900 transition-colors">
                Espace medecin
              </a>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Donnees conformes CNDP
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Support 7j/7
              </span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              &copy; {new Date().getFullYear()} Medapp Maroc. Tous droits reserves.
              Medapp est une plateforme de mise en relation — les medecins exercent en leur nom propre.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
