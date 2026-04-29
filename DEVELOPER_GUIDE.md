# 👨‍💻 Guide développeur

Ce document est ton aide-mémoire pour comprendre où mettre les choses au fur et à mesure que tu codes.

---

## 🧩 Ajouter un nouveau module backend (ex: `consultations`)

```bash
cd apps/api/src
mkdir consultations
```

Crée 3 fichiers minimum :

```ts
// consultations/consultations.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  findByPatient(patientId: string) {
    return this.prisma.consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }
}
```

```ts
// consultations/consultations.controller.ts
import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ConsultationsService } from "./consultations.service";

@Controller("consultations")
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private service: ConsultationsService) {}

  @Get("mine")
  mine(@Request() req: { user: { id: string } }) {
    // À adapter : récupérer le patientId via le userId
    return this.service.findByPatient(req.user.id);
  }
}
```

```ts
// consultations/consultations.module.ts
import { Module } from "@nestjs/common";
import { ConsultationsController } from "./consultations.controller";
import { ConsultationsService } from "./consultations.service";

@Module({
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
})
export class ConsultationsModule {}
```

Puis enregistre-le dans `app.module.ts`.

---

## 🧱 Ajouter une migration BDD

1. Modifie `apps/api/prisma/schema.prisma`
2. `pnpm api:migrate` → te demande un nom de migration (ex: `add_prescription_field`)
3. Le client Prisma est régénéré automatiquement → les types TS sont à jour

⚠️ En **production**, on n'utilise **jamais** `migrate dev` mais `prisma migrate deploy`.

---

## 🎨 Ajouter une page Next.js

```bash
# Patient
apps/web-patient/app/consultations/page.tsx

# Médecin
apps/web-doctor/app/calendar/page.tsx
```

Next.js 15 utilise l'App Router : un dossier = une route, `page.tsx` = la page.

Pour une page protégée par auth, copie le pattern de `app/dashboard/page.tsx` (redirection si pas de `user`).

---

## 🔁 Ajouter un type partagé

Dans `packages/shared-types/src/index.ts`. Une fois ajouté, il est immédiatement disponible dans `api`, `web-patient`, et `web-doctor` :

```ts
import type { Consultation } from "@medapp/shared-types";
```

---

## 🔒 Sécurité — checklist avant prod

- [ ] Tous les secrets `.env` sont régénérés (pas ceux du `.env.example`)
- [ ] HTTPS partout (Cloudflare en frontal, ou certbot)
- [ ] Rate limiting sur `/auth/login` et `/auth/signup` (NestJS Throttler)
- [ ] Logs sans données sensibles (jamais de mot de passe, JAMAIS de données patient en clair)
- [ ] Backups automatiques Postgres (au minimum daily)
- [ ] Monitoring d'erreurs (Sentry)
- [ ] Validation préalable CNDP au Maroc avant traitement de données réelles
- [ ] CORS strict (uniquement les domaines de prod)
- [ ] Cookies sécurisés (httpOnly, secure, sameSite=strict)

---

## 🧪 Stratégie de test (à venir)

Pour démarrer, fais des tests manuels via les UI. Quand tu auras du trafic :

- **Backend** : Vitest + Supertest pour tests d'intégration
- **E2E** : Playwright sur les 2 frontends

---

## 💡 Conseils solo dev

1. **Commit souvent**, push à chaque fin de session. Branche `develop` pour le WIP, `main` pour ce qui est stable.
2. **Une feature à la fois**. Ne commence pas le forum tant que la consultation n'est pas finie.
3. **N'optimise pas trop tôt**. Postgres + Redis tiennent largement les premiers 10 000 utilisateurs.
4. **Note tout dans un fichier `IDEAS.md`** quand tu penses à une amélioration — sinon tu vas te disperser.
5. **Demande des retours** dès que la phase 1 est utilisable. Trouve 5 médecins amis + 20 patients amis pour tester avant de scaler.
