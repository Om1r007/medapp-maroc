import Link from "next/link";

const doctorUrl = process.env.NEXT_PUBLIC_DOCTOR_APP_URL ?? "http://localhost:3001";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Medapp</span>
            </div>
            <p className="text-sm leading-relaxed">
              Téléconsultation médicale au Maroc. Un médecin certifié en moins de 15 minutes.
            </p>
            <p className="mt-4 text-xs">© {new Date().getFullYear()} Medapp Maroc. Tous droits réservés.</p>
          </div>

          {/* Col 2 — Produit */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Produit</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/comment-ca-marche" className="hover:text-white transition-colors">Comment ça marche</Link></li>
              <li><Link href="/tarifs" className="hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link href="/securite" className="hover:text-white transition-colors">Sécurité & confidentialité</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Col 3 — Médecins */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Pour les médecins</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/medecins" className="hover:text-white transition-colors">Devenir médecin partenaire</Link></li>
              <li>
                <a href={`${doctorUrl}/login`} className="hover:text-white transition-colors">
                  Espace médecin
                </a>
              </li>
              <li><Link href="/a-propos" className="hover:text-white transition-colors">À propos</Link></li>
            </ul>
          </div>

          {/* Col 4 — Légal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Légal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
            </ul>
            <div className="mt-6">
              <p className="text-xs">
                <span className="text-neutral-500">Contact : </span>
                <a href="mailto:contact@medapp.ma" className="hover:text-white transition-colors">
                  contact@medapp.ma
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
