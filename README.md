# Medapp Maroc 🇲🇦

Plateforme de téléconsultation médicale type Medadom, adaptée au contexte marocain.

> **Stack** : Turborepo · NestJS · Next.js 15 · PostgreSQL · Redis · Prisma · TypeScript

---

## 📦 Structure du projet

```
medapp-maroc/
├── apps/
│   ├── api/             → Backend NestJS (port 4000)
│   ├── web-patient/     → Frontend patient Next.js (port 3000)
│   └── web-doctor/      → Frontend médecin Next.js (port 3001)
├── packages/
│   ├── shared-types/    → Types TS partagés (Patient, Doctor, Consultation…)
│   └── config/          → Configs TSConfig partagées
├── docker-compose.yml   → Postgres + Redis local
├── turbo.json           → Orchestrateur monorepo
└── .env.example         → Toutes les variables d'environnement
```

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js 20+** ([nvm](https://github.com/nvm-sh/nvm) recommandé)
- **pnpm 9+** : `npm install -g pnpm`
- **Docker Desktop** (pour Postgres + Redis)
- **Git**

### Installation — étape par étape

```bash
# 1. Cloner / extraire le projet
cd medapp-maroc

# 2. Installer toutes les dépendances (tout le monorepo)
pnpm install

# 3. Copier le fichier d'environnement
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web-patient/.env.example apps/web-patient/.env.local
cp apps/web-doctor/.env.example apps/web-doctor/.env.local

# 4. Générer des secrets JWT (et les coller dans .env)
openssl rand -base64 32   # → JWT_SECRET
openssl rand -base64 32   # → JWT_REFRESH_SECRET

# 5. Démarrer Postgres + Redis
pnpm db:up

# 6. Créer le schéma de base de données
pnpm api:migrate
# (te demandera un nom de migration → tape "init")

# 7. Lancer toute la stack en mode dev
pnpm dev
```

Tu devrais voir :

- **API** : http://localhost:4000/api/health
- **App patient** : http://localhost:3000
- **App médecin** : http://localhost:3001

---

## 🧪 Tester que tout fonctionne

### 1. Healthcheck API

```bash
curl http://localhost:4000/api/health
# → {"status":"ok","services":{"database":"up"}}
```

### 2. Inscription patient

Va sur http://localhost:3000/signup et crée un compte test :

- Téléphone : format `+212XXXXXXXXX` (ex. `+212600000001`)
- CIN : 1-2 lettres + 5-6 chiffres (ex. `AB123456`)
- Mot de passe : 8 caractères minimum

Tu seras redirigé vers le dashboard.

### 3. Inscription médecin

Sur http://localhost:3001/signup. Le médecin est créé en statut `PENDING`. Pour le valider en dev, ouvre Prisma Studio :

```bash
pnpm api:studio
```

Puis dans l'interface : table **Doctor** → change `status` à `VERIFIED` et `isAvailable` à `true`.

---

## 🛠️ Commandes utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Lance api + web-patient + web-doctor en parallèle |
| `pnpm db:up` | Démarre Postgres + Redis (Docker) |
| `pnpm db:down` | Stoppe les containers |
| `pnpm db:reset` | **Supprime toutes les données** et redémarre |
| `pnpm api:migrate` | Crée/applique une migration Prisma |
| `pnpm api:studio` | Ouvre Prisma Studio (UI base de données) |
| `pnpm api:generate` | Régénère le client Prisma après modif schema |
| `pnpm build` | Build de tout le monorepo |

---

## 🗄️ Modèle de données

Voir `apps/api/prisma/schema.prisma` pour le schéma complet.

**Entités principales** :

- **User** : compte de base (email, phone, password) avec un rôle (PATIENT, DOCTOR, ADMIN)
- **Patient** : 1-1 avec User, contient CIN + date de naissance
- **Doctor** : 1-1 avec User, contient N° Ordre + spécialité + statut de validation + tarif
- **Consultation** : lien Patient ↔ Doctor avec statut, paiement, vidéo, etc.
- **Rating** : note privée du médecin (non visible côté patient)

---

## 🔐 Endpoints API actuels

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Healthcheck (DB) |
| POST | `/api/auth/signup/patient` | Inscription patient |
| POST | `/api/auth/signup/doctor` | Inscription médecin (statut PENDING) |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur (JWT requis) |

---

## 📋 Roadmap MVP

### ✅ Phase 0 — Setup (fait)
- Monorepo Turborepo
- Backend NestJS + Prisma + PostgreSQL
- 2 frontends Next.js séparés (patient / médecin)
- Auth JWT (signup/login/me)
- Validation des inputs (CIN marocaine, téléphone +212)
- Schéma BDD complet

### 🔜 Phase 1 — Cœur consultation (4-6 semaines)
- [ ] Vérification téléphone par OTP SMS (Twilio en dev)
- [ ] Upload + vérif CIN scannée (S3)
- [ ] Toggle disponibilité médecin (persisté)
- [ ] File d'attente Redis (BullMQ) — position en temps réel
- [ ] Paiement CMI (sandbox)
- [ ] Salle vidéo Daily.co
- [ ] Compte-rendu + prescription côté médecin

### 🔜 Phase 2 — Espaces & polish (3-4 semaines)
- [ ] Espace patient : historique, paiements, certificats
- [ ] Espace médecin : calendrier, facturation PDF
- [ ] Notifications email (Resend ou SES)
- [ ] Rating médecin (privé)

### 🔮 Plus tard — V2
- [ ] Conventions mutuelles (CNSS / CNOPS / AMO)
- [ ] Signature électronique des certificats (Barid eSign)
- [ ] App mobile React Native
- [ ] Forum (avec modération)

---

## 🇲🇦 Spécificités Maroc à garder en tête

### Réglementation
- **Loi 09-08** (CNDP) : équivalent RGPD. Données de santé = sensibles → autorisation préalable CNDP avant prod.
- **Loi 131-13** : exercice de la médecine, encadre la télémédecine.
- **Hébergement** : idéalement au Maroc (Inwi Cloud, MT Cloud) pour respecter la juridiction.

### Vérification médecins
La vérification doit être **manuelle** au début. Méthode :
1. Médecin s'inscrit (statut `PENDING`)
2. Tu reçois une notif (à coder)
3. Tu vérifies le N° d'Ordre sur l'annuaire de l'[Ordre National des Médecins](https://www.ordremedecinsmaroc.ma)
4. Tu actives le compte via Prisma Studio (ou plus tard une interface admin)

### Paiement
- **CMI** = standard pour cartes bancaires marocaines. Nécessite une convention via ta banque.
- **Alternatives plus rapides à intégrer** : YouCan Pay, PayZone (utiles pour le MVP avant convention CMI).

### Téléphone
Format E.164 strict : `+212` suivi de 9 chiffres (sans le 0 initial).
Ex. `06 12 34 56 78` → `+212612345678`.

---

## 🐛 Troubleshooting

### "Cannot connect to database"
Vérifie que Docker tourne : `docker ps` doit montrer `medapp-postgres` et `medapp-redis`.
Si pas le cas : `pnpm db:up`.

### "Module @medapp/shared-types not found"
Tu as oublié `pnpm install` à la racine, ou tu lances depuis un sous-dossier.
Lance toujours depuis la racine du monorepo.

### Prisma : "Environment variable not found: DATABASE_URL"
Prisma cherche `.env` dans `apps/api/.env` (pas la racine).
Vérifie que `apps/api/.env` existe et contient la `DATABASE_URL`.

### Le port 3000/3001/4000 est déjà utilisé
```bash
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Documentation des outils

- [Turborepo](https://turbo.build/repo/docs)
- [NestJS](https://docs.nestjs.com)
- [Prisma](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Daily.co (vidéo)](https://docs.daily.co)
- [CMI Maroc (paiement)](https://www.cmi.co.ma)

---

## 📄 Licence

Privé — projet propriétaire.
