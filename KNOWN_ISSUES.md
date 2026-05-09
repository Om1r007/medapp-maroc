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
