# Known Issues & Edge Cases non gérés (Brique 5a)

## Calendrier de disponibilité (Brique 5a)

### Cron granularité 1 minute
Le scheduler tourne toutes les minutes. Un médecin peut donc rester disponible/indisponible jusqu'à 59 secondes après la fin/début de son créneau. Acceptable pour le MVP.

### Chevauchement UTC / local à minuit
`AvailabilitySlot.startTime/endTime` sont des strings HH:mm en heure Casablanca. Pour les créneaux qui commencent à 00:00, la comparaison en minutes fonctionne correctement car on reste dans le même jour calendaire local. Pas d'ambiguïté DST (UTC+1 fixe).

### Pas de validation du chevauchement sur les PATCH de slots
Le `PATCH /availability/slots/:id` vérifie le chevauchement en excluant le slot modifié — mais si deux PATCH simultanés arrivent, un chevauchement peut passer. Acceptable MVP.

### Override permanent sans durée ne se clear pas automatiquement
Si `durationMinutes` est omis, `manualOverrideUntil = null` → le scheduler ne clear jamais l'override. Le médecin doit explicitement choisir "Mode automatique" ou `DELETE /availability/override`.

### Performance du scheduler sous charge
Le scheduler fait 2 requêtes DB par médecin (slots + exceptions). Pour 100+ médecins, envisager un batch en Phase 2. Acceptable MVP.

# Known Issues & Edge Cases non gérés

## Vidéo (Brique 4)

### Médecin perd la connexion en plein call
La room Daily.co reste active (TTL 1h). Le médecin peut rouvrir `/consultation/[id]`, récupérer un nouveau token via `/video-token` et rejoindre. Le patient reste dans le call. Pas de gestion automatique de reconnexion côté app.

### Médecin termine sans remplir le diagnostic
Le backend valide `diagnosis` avec `@IsString() @MaxLength(2000)` — sans `@IsNotEmpty()`. Une chaîne vide `""` passe la validation. **À corriger** : ajouter `@IsNotEmpty()` sur le DTO `EndConsultationDto` si on veut bloquer côté backend (le frontend l'interdit déjà).

### Room expire (1h) avant fin de consultation
Si la room Daily.co expire pendant la consultation (`exp` à +3600s), les participants sont expulsés. La consultation reste en `IN_PROGRESS` dans la DB. Le médecin peut quand même appeler `end-consultation` — `destroyRoom` échouera avec 404 mais c'est géré (try/catch + log). La consultation sera correctement clôturée côté DB.

### Patient consulte la page vidéo avant que le médecin démarre
La page `/consultation/[id]` côté patient poll toutes les 3 sec. Elle affiche un spinner "En attente du médecin". L'appel à `/video-token` n'est fait qu'une fois `videoRoomUrl` non-null, ce qui évite un 400 prématuré.

### Pas de notification fin de consultation côté patient
Le patient découvre que la consultation est terminée via polling (refetchInterval: 3s). Si le tab est en arrière-plan, le polling est throttlé par le navigateur. À remplacer par Socket.IO en Phase 2.

# Known Issues & Edge Cases non gérés (Brique 3)

## File d'attente (Brique 3)

### Timeout après requeue
Quand un médecin se désiste et le patient est remis en file (`requeue`), un nouveau timer de 15 min est lancé depuis maintenant. Le timer original n'est pas repris — le patient bénéficie d'un reset complet. Comportement acceptable pour le MVP.

### Double requeue
Si un médecin toggle OFF/ON très rapidement avec un patient MATCHED, un double appel à `requeue` puis `tryMatch` peut survenir. Le lock Redis sur `tryMatch` protège contre le double-match, mais pas contre un double-requeue. À surveiller sous charge.

### Restart de l'API
Les jobs BullMQ delayed (timeouts) sont persistés dans Redis et survivent au redémarrage de l'API. En revanche, si Redis est vidé (`FLUSHALL`), tous les timeouts sont perdus — les consultations IN_QUEUE ne seront jamais remboursées automatiquement. Solution future : job de réconciliation au démarrage.

### Position dans la file après requeue
Un patient requeue reçoit `queuedAt = new Date(1)` (epoch) pour être prioritaire. Si plusieurs patients sont requeueués, ils ont tous le même `queuedAt` et l'ordre entre eux est indéterminé. À corriger si ce scénario devient fréquent.

### Pas de notification push
Le médecin découvre qu'il a un patient via polling toutes les 3 secondes. Si l'onglet est fermé, il ne reçoit aucune notification. À corriger avec Socket.IO ou notifications browser en Phase 2.

### Estimation du temps d'attente
L'estimation est `position × AVG_CONSULTATION_MINUTES` (valeur fixe). Elle ne tient pas compte des médecins déjà en consultation, de la spécialité, ni des stats historiques. À affiner en Phase 2.

### Annulation d'une consultation MATCHED
Un patient ne peut pas annuler une consultation en statut MATCHED (seuls WAITING_PAYMENT et IN_QUEUE sont annulables). Si le médecin tarde à démarrer, le patient est bloqué. À gérer : soit permettre l'annulation MATCHED avec retour en queue pour le patient, soit ajouter un timeout côté médecin.

### Concurrence extrême
Le lock Redis SET NX a une TTL de 5 secondes. Si `tryMatch` prend plus de 5 secondes (requête Prisma lente), un second appel concurrent pourrait acquérir le lock et matcher le même patient. Acceptable pour le MVP, à remplacer par Redlock en production.
