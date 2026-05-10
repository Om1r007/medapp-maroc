# Guide de déploiement — Medapp Maroc

Stack cible : **Render** (API + PostgreSQL) · **Upstash** (Redis) · **Vercel** (3 frontends)

---

## Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────┐
│  Vercel                                         │
│  ├── web-landing  (site vitrine)                │
│  ├── web-patient  (app patients)                │
│  └── web-doctor   (app médecins)                │
└────────────────────┬────────────────────────────┘
                     │ HTTPS (NEXT_PUBLIC_API_URL)
┌────────────────────▼────────────────────────────┐
│  Render                                         │
│  └── api (NestJS) ──► PostgreSQL (Render DB)    │
│         │                                       │
│         └──► Upstash Redis (BullMQ + invoices)  │
└─────────────────────────────────────────────────┘
```

---

## Étape 1 — Créer la base PostgreSQL sur Render

1. Aller sur [render.com](https://render.com) → **New → PostgreSQL**
2. Remplir :
   - **Name** : `medapp-db`
   - **Region** : choisir la plus proche (ex: Frankfurt)
   - **Plan** : Free
3. Cliquer **Create Database**
4. Une fois créé, copier la **Internal Database URL** (format `postgresql://...`) → tu en auras besoin à l'Étape 3.

---

## Étape 2 — Créer Redis sur Upstash

1. Aller sur [upstash.com](https://upstash.com) → **Create Database**
2. Remplir :
   - **Name** : `medapp-redis`
   - **Type** : Redis
   - **Region** : même région que Render
   - **Plan** : Free
3. Une fois créé, aller dans l'onglet **Details** → copier le **Redis URL** (format `rediss://...`) → tu en auras besoin à l'Étape 3.

---

## Étape 3 — Déployer l'API sur Render

1. Aller sur [render.com](https://render.com) → **New → Web Service**
2. Connecter ton repo GitHub `medapp-maroc-web`
3. Configurer :
   - **Name** : `medapp-api`
   - **Root Directory** : `apps/api`
   - **Runtime** : Node
   - **Build Command** : `npm install -g pnpm && pnpm install --filter api && pnpm --filter api exec prisma generate && pnpm --filter api run build`
   - **Start Command** : `pnpm --filter api run start:prod`
   - **Plan** : Free (ou Starter pour éviter le cold start)
4. Ajouter les **Environment Variables** (onglet Environment) :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL copiée à l'Étape 1 (Internal URL) |
| `REDIS_URL` | URL copiée à l'Étape 2 |
| `NODE_ENV` | `production` |
| `API_PORT` | `4000` |
| `JWT_SECRET` | Générer : `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Générer : `openssl rand -base64 32` (différent du précédent) |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `APP_URL_PATIENT` | URL Vercel de web-patient (ex: `https://medapp-patient.vercel.app`) |
| `APP_URL_DOCTOR` | URL Vercel de web-doctor (ex: `https://medapp-doctor.vercel.app`) |
| `VIDEO_PROVIDER` | `daily` |
| `DAILY_API_KEY` | Clé depuis [dashboard.daily.co](https://dashboard.daily.co) → Settings → Developer |
| `DAILY_DOMAIN` | Ton domaine Daily (ex: `medapp-xxxx.daily.co`) |
| `PAYMENT_PROVIDER` | `mock` (pour commencer) |
| `QUEUE_TIMEOUT_MINUTES` | `15` |
| `AVG_CONSULTATION_MINUTES` | `4` |
| `AVAILABILITY_CRON_EXPRESSION` | `0 * * * * *` |
| `TIMEZONE` | `Africa/Casablanca` |
| `CONSULTATION_AUTO_CLOSE_HOURS` | `1` |

5. **Health Check Path** : `/api/health`
6. Cliquer **Create Web Service**

> Les migrations Prisma (`migrate deploy`) sont exécutées automatiquement au démarrage via `start:prod`.

---

## Étape 4 — Déployer les 3 frontends sur Vercel

### Prérequis : Ajouter `TURBO_TEAM` et `TURBO_TOKEN` si tu utilises Turbo Remote Cache (optionnel, peut être ignoré).

### 4a — Site vitrine (web-landing)

1. Aller sur [vercel.com](https://vercel.com) → **Add New → Project**
2. Importer le repo `medapp-maroc-web`
3. Configurer :
   - **Framework Preset** : Next.js
   - **Root Directory** : `apps/web-landing`
4. Ajouter les variables d'environnement :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_PATIENT_APP_URL` | URL Vercel de web-patient |
| `NEXT_PUBLIC_DOCTOR_APP_URL` | URL Vercel de web-doctor |
| `NEXT_PUBLIC_SITE_URL` | URL Vercel de web-landing |

5. **Deploy**

### 4b — App patient (web-patient)

1. Même procédure, **Root Directory** : `apps/web-patient`
2. Variables d'environnement :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL Render de l'API (ex: `https://medapp-api.onrender.com`) |
| `NEXT_PUBLIC_DOCTOR_APP_URL` | URL Vercel de web-doctor |

3. **Deploy**

### 4c — App médecin (web-doctor)

1. Même procédure, **Root Directory** : `apps/web-doctor`
2. Variables d'environnement :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL Render de l'API |
| `NEXT_PUBLIC_PATIENT_APP_URL` | URL Vercel de web-patient |

3. **Deploy**

---

## Étape 5 — Mettre à jour les CORS de l'API

Une fois les 3 URLs Vercel connues, retourner dans Render → ton service API → **Environment** et mettre à jour :

- `APP_URL_PATIENT` → URL réelle de web-patient sur Vercel
- `APP_URL_DOCTOR` → URL réelle de web-doctor sur Vercel

Puis **Manual Deploy** pour relancer.

---

## Étape 6 — Configurer Daily.co

1. Aller sur [dashboard.daily.co](https://dashboard.daily.co) → **Settings → Allowed origins**
2. Ajouter :
   - URL de web-patient (ex: `https://medapp-patient.vercel.app`)
   - URL de web-doctor (ex: `https://medapp-doctor.vercel.app`)
3. Copier ta **API Key** (Settings → Developer) et ton **domaine** (ex: `medapp-xxxx.daily.co`)
4. Mettre à jour dans Render : `DAILY_API_KEY` et `DAILY_DOMAIN`

---

## Étape 7 — Tester l'intégration

### Checklist de test

- [ ] `GET https://medapp-api.onrender.com/api/health` → répond `{ "status": "ok" }`
- [ ] Créer un compte patient sur web-patient → connexion OK
- [ ] Créer un compte médecin sur web-doctor → connexion OK
- [ ] Patient : créer une nouvelle consultation → paiement mock → file d'attente
- [ ] Médecin : accepter la consultation depuis le dashboard
- [ ] Les deux : rejoindre la salle vidéo Daily.co → son + image
- [ ] Médecin : terminer la consultation → résumé visible côté patient

### Commandes utiles pour débugger

```bash
# Voir les logs de l'API en temps réel (depuis Render Dashboard → Logs)
# Tester l'API manuellement
curl https://medapp-api.onrender.com/api/health

# Tester l'auth
curl -X POST https://medapp-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

---

## Variables d'environnement — Résumé complet

### API (Render)
Voir `apps/api/.env.example` pour la liste complète.

### web-patient (Vercel)
```
NEXT_PUBLIC_API_URL=https://medapp-api.onrender.com
NEXT_PUBLIC_DOCTOR_APP_URL=https://medapp-doctor.vercel.app
```

### web-doctor (Vercel)
```
NEXT_PUBLIC_API_URL=https://medapp-api.onrender.com
NEXT_PUBLIC_PATIENT_APP_URL=https://medapp-patient.vercel.app
```

### web-landing (Vercel)
```
NEXT_PUBLIC_PATIENT_APP_URL=https://medapp-patient.vercel.app
NEXT_PUBLIC_DOCTOR_APP_URL=https://medapp-doctor.vercel.app
NEXT_PUBLIC_SITE_URL=https://medapp-landing.vercel.app
```

---

## Notes importantes

### Plan Free Render — Cold starts
Le plan Free de Render met le service en veille après 15 min d'inactivité. Le premier appel après inactivité peut prendre 30-60s. Pour éviter ça, upgrader vers le plan Starter ($7/mois) ou utiliser un cron externe pour pinguer `/api/health` toutes les 10 min.

### Migrations Prisma en production
Le script `start:prod` exécute `prisma migrate deploy` avant de démarrer l'API. C'est idempotent — il n'applique que les migrations non encore jouées.

### Paiement CMI (production future)
Quand tu es prêt à activer CMI (vrai paiement bancaire marocain) :
1. Changer `PAYMENT_PROVIDER=cmi`
2. Remplir `CMI_MERCHANT_ID`, `CMI_STORE_KEY`
3. Mettre `CMI_CALLBACK_URL=https://medapp-api.onrender.com/payments/cmi/callback`
