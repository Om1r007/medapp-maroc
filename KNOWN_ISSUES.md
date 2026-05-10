# Known Issues

## Auto-close loses doctor's diagnosis window

**Severity**: Medium  
**Affects**: Doctor experience when consultation is auto-closed by timeout

**Description**  
When a consultation is automatically closed after `CONSULTATION_AUTO_CLOSE_HOURS` (default: 1h) because the doctor did not click "Terminer", the system marks it `COMPLETED` with `autoClosedByTimeout = true` and `diagnosis = null`. The doctor never gets a chance to enter their diagnosis or prescription.

**Current mitigation**  
- The doctor UI shows a persistent warning banner: *"⚠️ Cette consultation sera automatiquement clôturée 1h après son démarrage. Pensez à cliquer sur Terminer pour saisir votre compte-rendu."*
- The `GET /doctors/me/incomplete-consultations` endpoint returns auto-closed consultations with no diagnosis, so the doctor dashboard can surface a follow-up prompt.

**Planned fix (not yet implemented)**  
Add a post-close diagnosis flow: after detecting `autoClosedByTimeout = true` + `diagnosis = null` on the doctor dashboard, redirect the doctor to a lightweight form (`/consultations/:id/complete`) to fill in the diagnosis and prescription retroactively. The API endpoint `POST /consultations/:id/complete-late` would accept diagnosis/prescription and only be callable when `autoClosedByTimeout = true && diagnosis IS NULL`.

---

## Polling-based sync — limite à ~1000 utilisateurs simultanés

**Severity**: Low (acceptable pour MVP)  
**Affects**: Scalabilité de la synchronisation temps réel

**Description**  
La synchronisation UI/backend repose sur du polling agressif (3–5 s par query active). Avec 100 médecins connectés faisant chacun 2–3 queries critiques, l'API reçoit environ **60–90 requêtes/sec** au repos — largement dans les capacités de NestJS + PostgreSQL pour le MVP.  
Au-delà de ~1 000 utilisateurs simultanés, ce modèle devient coûteux.

**Planned fix (non urgent)**  
Migrer les queries temps réel (`pending-consultation`, `queue-status`, `consultation`) vers **Socket.IO** (WebSocket) pour du push serveur → client. Réduirait la charge à near-zero requêtes de polling. À planifier en V2.

---

## Brique 5c — Facturation PDF : limitations connues

**Sévérité** : Faibles (acceptable pour MVP)

### Stockage local des PDFs
Les PDFs sont stockés dans `apps/api/storage/invoices/{year}/{month}/`. À migrer vers S3 / Wasabi / MT Cloud avant la mise en production pour garantir scalabilité et backup.

### Identité Medapp dans les variables d'environnement
Les champs ICE, IF, RC dans `.env` contiennent des valeurs fictives pour le développement. Remplir avec les vraies valeurs officielles (enregistrées à la DGI et au RC) avant toute utilisation en production. Une facture avec de faux identifiants fiscaux n'a pas de valeur légale.

### Redis KEYS — à migrer vers SCAN avant prod
La numérotation séquentielle des factures utilise `redis.del(lockKey)` sur une clé simple. Si on avait besoin d'invalider des patterns (`stats:{doctorId}:*` par exemple), la commande Redis `KEYS` est utilisée — elle bloque Redis pendant l'exécution. À migrer vers `SCAN` en production au-delà de 10 000 médecins.

### Pas de signature électronique
Les PDFs générés ne sont pas signés électroniquement. Valeur probante limitée en cas de litige. Prévoir intégration **Barid eSign** en V2.

### Pas d'envoi email automatique
Les factures ne sont pas envoyées par email aux destinataires. Prévoir intégration Mailgun / Postmark en V2.

---

## Payment provider limited to mock in dev

**Severity**: Low (expected in dev)  
**Affects**: Payment flow

**Description**  
`PAYMENT_PROVIDER=mock` returns a fake successful payment. Real CMI integration (Moroccan payment gateway) requires a bank convention and test credentials. The mock is intentional during MVP development.

---

## Brique 6.2 — Pré-consultation

### Liste de symptômes hardcodée
Les 30 symptômes proposés dans le wizard de pré-consultation sont définis statiquement dans `pre-consult.controller.ts`. En V2, migrer vers une table `Symptom` en base de données éditable par les admins.

### Mode urgent à monitorer
Le déclenchement du mode URGENT (score douleur ≥ 8 ou case cochée par le patient) n'alerte pas le médecin en temps réel. À intégrer avec un système de notification push/email en V2.

---

## Brique 6.3 — Dossier patient partagé

### Version CGU hardcodée pour MVP
La version des CGU acceptées par le patient est fixée à `"2026-05-v1"` dans `sharing-consent.service.ts`. En V2, externaliser cette valeur en base de données avec un mécanisme de re-consentement automatique si la version change.

### Hash IP avec SHA-256 + salt fixe pour MVP
Le hash des IPs pour l'audit (PatientFileAccessLog, ConsentLog) utilise un salt fixe défini dans la variable d'environnement `AUDIT_IP_SALT`. En V2, implémenter une rotation périodique du salt pour anonymiser progressivement les anciens logs.

### Notification email au patient si nouvelle consultation accède à son dossier (V2)
Hors scope V1. À implémenter via Postmark (Brique 7) — le patient devrait recevoir un email à chaque accès médecin à son dossier pour une transparence maximale conforme à la Loi 09-08.

### Rétention logs d'accès — pas de purge automatique
Les `PatientFileAccessLog` doivent être conservés minimum 2 ans (obligation médicale Maroc). Aucun mécanisme de purge automatique n'est implémenté. À ajouter en V2 avec un scheduler qui archive les logs > 2 ans en cold storage.

---

## Brique 6.4 — Médecin référent

### Formule d'estimation du délai simplifiée
`getNextAvailabilityForDoctor()` calcule `queueLength × avgMin + 5min` en ignorant la consultation en cours du médecin. En V2, interroger `startedAt` de la consultation active pour une estimation plus précise.

### Notification push/email pas implémentée
Le `FallbackCheckerScheduler` détecte les patients référents qui attendent depuis plus de 20 min et logue un warning, mais n'envoie pas de notification push ni email. À intégrer avec Postmark/OneSignal en V2.

### Un seul médecin référent par patient
La brique 6.4 limite chaque patient à un seul médecin référent (un pointeur `referringDoctorId` sur `Patient`). Une liste multi-référents n'est pas supportée. Acceptable pour le MVP.

### Pas de vérification de disponibilité avant la désignation
Lors de la création d'une consultation en mode référent, la disponibilité du médecin n'est pas vérifiée au moment de l'appel `POST /consultations`. La vérification se fait au `enqueue()` : si le médecin est indisponible, la consultation reste en file jusqu'à ce qu'il devienne disponible ou jusqu'au timeout (15 min → remboursement).

---

## Brique 9a — web-landing

### Pages légales à valider par avocat
Les pages `/mentions-legales`, `/confidentialite`, `/cgu` contiennent des placeholders. Ces documents doivent être rédigés et validés par un avocat marocain spécialisé en droit numérique et médical avant toute mise en production.

### Formulaire de contact — email mock pour MVP
Le formulaire `/contact` envoie un `POST /api/contact` qui pour l'instant logge seulement le message côté serveur (`console.log`). À connecter à un vrai service email transactionnel (Postmark, Mailgun) avant la prod. Variable d'environnement `CONTACT_EMAIL` à ajouter au `.env`.

### OG-image générique
Le fichier `/public/og-image.jpg` n'existe pas encore (référencé dans les métadonnées Open Graph). À créer avec Figma ou Canva (1200×630px) avant la mise en ligne pour une preview correcte sur Facebook/LinkedIn/Twitter.

### Témoignages absents pour MVP
La section Témoignages sur la homepage est un placeholder honnête en attendant les premiers beta-testers. À remplacer par de vrais témoignages après la phase bêta.

### Accordion Radix — animations CSS custom à ajouter si besoin
Les animations `accordionDown`/`accordionUp` dans `components/home/FAQ.tsx` référencent des keyframes Tailwind custom. Si l'animation est absente, ajouter dans `tailwind.config.ts` ou `globals.css` les keyframes correspondantes.
