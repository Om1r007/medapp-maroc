# LEGAL_DATA_FLOW.md — Medapp Maroc

## Conformité : Loi 09-08 (CNDP) · Loi 131-13 (Télémédecine) · Code de déontologie médicale marocaine

---

## 1. Données stockées et leur nature

| Catégorie | Données | Sensibilité |
|-----------|---------|-------------|
| Identité patient | Nom, prénom, CIN, date de naissance, sexe, ville, photo | Personnelles |
| Santé patient | Allergies, antécédents, médicaments, groupe sanguin, taille, poids | **Sensibles (santé)** |
| Consultation | Symptômes, durée, douleur, diagnostic, prescription | **Sensibles (santé)** |
| Consentement partage | Timestamp activation, version CGU, hash IP, user agent | Traçabilité légale |
| Accès dossier | Doctor ID, patient ID, type d'accès, timestamp, hash IP | Audit médical |
| Identité médecin | Nom, prénom, CIN, INPE, n° Ordre, spécialité, photo, diplôme | Professionnelles |
| Paiement | Montant, référence transaction (pas de CB directement) | Financières |
| Factures | Reçus PDF avec montants, référence consultation | Financières |

---

## 2. Localisation des données

**Base de données** : PostgreSQL, hébergée sur `localhost:5432` (dev). En production : hébergement à définir, idéalement cloud marocain ou UE (RGPD-compatible).

**Fichiers statiques** : Avatars patients et médecins stockés dans `storage/avatars/` sur le serveur applicatif. Photos de diplômes dans `storage/docs/` (à implémenter).

**Factures PDF** : stockées dans `storage/invoices/` sur le serveur applicatif.

---

## 3. Qui peut accéder aux données

### Patient
- **Ses propres données** : profil complet, toutes ses consultations, historique des accès à son dossier.
- **Données d'un médecin** : profil public anonymisé (nom tronqué, spécialité, score, badges).
- **Ne voit pas** : données d'autres patients, données de facturation des médecins.

### Médecin (VERIFIED)
- **Ses propres données** : profil, ses consultations, ses avis/feedback, sa facturation.
- **Données patient pendant une consultation active (MATCHED/IN_PROGRESS)** : profil santé du patient assigné, brief de la consultation, historique partagé si consent activé.
- **Ne peut PAS accéder** : dossier patient sans consultation active, consultations exclues du partage, données d'autres médecins.

### Administrateur Medapp
- **Accès pour vérification** : dossiers de vérification des médecins (diplôme, INPE, Ordre).
- **Actions** : approuver/rejeter/réactiver des médecins.
- **Ne voit pas** : consultations en cours, données de santé des patients (sauf accès direct DB, hors interface).

### Système (automatique)
- **Scheduler de modération** : lit qualityScore + totalRatings des médecins pour suspension auto.
- **Auto-close scheduler** : termine les consultations > 1h après démarrage.

---

## 4. Durée de conservation

| Données | Durée | Motif |
|---------|-------|-------|
| Dossier médical patient | **Durée légale + 10 ans** après dernière consultation | Obligation médicale Maroc |
| Logs d'accès au dossier (PatientFileAccessLog) | **Minimum 2 ans** | Obligation médicale Maroc |
| Logs de consentement (ConsentLog) | **5 ans** | Opposabilité juridique du consentement |
| Factures | **10 ans** | Code de commerce marocain |
| Avis/ratings | **Durée relation contractuelle** | Amélioration qualité service |
| Logs techniques | **90 jours** | Débogage et sécurité |

---

## 5. Droits CNDP du patient (Loi 09-08, Art. 7)

Les patients Medapp disposent des droits suivants :

### Droit d'accès (Art. 7-1)
Contact : **support@medapp.ma** avec objet "Droit d'accès - [Prénom Nom]"
Délai de réponse : 30 jours.
Ce que le patient reçoit : export CSV de toutes ses données (profil, consultations, logs d'accès).

### Droit de rectification (Art. 7-2)
Données modifiables directement : profil info, profil santé.
Données à demander par support : CIN, date de naissance (vérification identité requise).

### Droit d'opposition (Art. 7-3)
Le patient peut désactiver le partage de son dossier à tout moment depuis `/profile/sharing`.
Le traitement des données pour la téléconsultation est nécessaire à l'exécution du contrat (il ne peut pas s'y opposer tout en utilisant le service).

### Droit à l'effacement / Suppression de compte
Demande via support uniquement (action irréversible, vérification identité requise).
Données conservées malgré suppression : factures (obligation légale 10 ans), logs de consentement (opposabilité juridique 5 ans), logs médicaux (obligation médicale).

### Droit à la portabilité
Export CSV disponible sur demande (voir droit d'accès).
Format FHIR (interopérabilité internationale) : V2.

---

## 6. Sécurité des données sensibles

### Hash des IPs pour l'audit
Les IPs ne sont jamais stockées en clair. Elles sont hashées avec SHA-256 + salt fixe :
```
hash = SHA256(AUDIT_IP_SALT + ":" + ip)
```
Le salt est stocké dans la variable d'environnement `AUDIT_IP_SALT`. En V2 : rotation périodique du salt pour anonymiser progressivement les anciens logs.

### Consentement opposable
Au moment de l'activation du partage, on stocke :
- Timestamp précis (UTC)
- Version des CGU acceptées (ex: `"2026-05-v1"`)
- Hash de l'IP
- User Agent du navigateur

Cette trace est opposable juridiquement en cas de litige.

### Accès médecin conditionnel
Un médecin ne peut accéder au dossier patient QUE si :
1. Une consultation lui est assignée (status MATCHED ou IN_PROGRESS)
2. Le patient a activé le consentement de partage
3. La consultation n'est pas exclue du partage par le patient

Tout accès est loggé automatiquement dans `PatientFileAccessLog`.

---

## 7. Notes MVP — À traiter en V2

- **Version CGU hardcodée** (`"2026-05-v1"`) : à externaliser en base de données éditable.
- **Salt IP fixe** : ajouter une rotation périodique en V2.
- **Notification email** : informer le patient à chaque nouvel accès à son dossier (hors scope V1).
- **Export FHIR** : interopérabilité internationale avec autres systèmes de santé.
- **Chiffrement E2E** : coffre-fort patient chiffré côté client (V3).
- **Anonymisation** : données agrégées pour recherche médicale (hors scope).
