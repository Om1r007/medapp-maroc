# Medapp Design System — Forward Health Style

> Version 1.0 — Brique 7 — Mai 2026

---

## Palette

### Primary — Blue 500 anchor

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#eff6ff` | Tinted backgrounds, active item bg |
| `primary-100` | `#dbeafe` | Hover states, selected row bg |
| `primary-200` | `#bfdbfe` | Borders on tinted surfaces |
| `primary-300` | `#93c5fd` | — |
| `primary-400` | `#60a5fa` | — |
| `primary-500` | `#3b82f6` | **Primary action, brand anchor** |
| `primary-600` | `#2563eb` | Hover on primary buttons, active links |
| `primary-700` | `#1d4ed8` | Active text on light bg |
| `primary-800` | `#1e40af` | — |
| `primary-900` | `#1e3a8a` | — |

### Neutral — Cool Gray base

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#f8fafc` | Page background |
| `neutral-100` | `#f1f5f9` | Skeleton, zebra rows |
| `neutral-200` | `#e2e8f0` | Borders, dividers |
| `neutral-300` | `#cbd5e1` | Input borders (default) |
| `neutral-400` | `#94a3b8` | Placeholder text, icons |
| `neutral-500` | `#64748b` | Secondary text, labels |
| `neutral-600` | `#475569` | Body text (secondary) |
| `neutral-700` | `#334155` | Body text |
| `neutral-800` | `#1e293b` | Headings |
| `neutral-900` | `#0f172a` | **Primary text** |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `success-50/700` | green tints | Confirmed, verified, positive trend |
| `warning-50/700` | amber tints | Pending, waiting, caution |
| `error-50/700` | red tints | Error states, destructive |

---

## Typography

**Font:** Plus Jakarta Sans (Google Fonts, loaded via `next/font/google`)

| Class | Size | Weight | Line-height | Use |
|-------|------|--------|-------------|-----|
| `text-xs` | 12px | — | 1.6 | Labels, captions, helper text |
| `text-sm` | 14px | — | 1.6 | Body, form text, table cells |
| `text-base` | 16px | — | 1.6 | Default body |
| `text-lg` | 18px | semibold | 1.4 | Card titles, subheadings |
| `text-2xl` | 24px | semibold | 1.3 | Page headings |
| `text-3xl/4xl` | 30–36px | bold | 1.2 | Section headings |
| `text-5xl/7xl` | 48–72px | bold | 1.0 | Hero heading |

Letter-spacing: `-0.02em` on `text-3xl+`, `-0.01em` on `text-xl/2xl`.

---

## Spacing

Follow a 4-point base unit. Prefer Tailwind's scale (`gap-4` = 16px, `p-6` = 24px, `p-8` = 32px).

Common patterns:
- Card padding: `p-6` (24px)
- Auth card padding: `p-8` (32px)
- Section vertical padding: `py-20 md:py-28`
- Stack spacing within a form: `space-y-4` or `space-y-5`
- Icon gap: `gap-2` (8px)

---

## Border Radius

| Class | Value | Use |
|-------|-------|-----|
| `rounded` | 4px | Tiny elements (badges, tooltips) |
| `rounded-md` | 6px | Buttons sm |
| `rounded-lg` | 8px | Inputs, dropdown, small cards |
| `rounded-xl` | 12px | Cards, modals, auth forms |
| `rounded-full` | 9999px | Avatars, pills |

**Rule:** Max radius is `rounded-xl` (12px / 1rem) for rectangular containers. No blobs.  
`rounded-2xl` is aliased to 1rem (same as `xl`) to prevent drift.

---

## Shadows

| Token | CSS | Use |
|-------|-----|-----|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards on hover |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)` | Floating panels, modals |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)` | Dropdowns, dialogs |

Default card state: no shadow (border-only). Add `shadow-sm` on hover.

---

## Components

### Button

```tsx
import { Button } from "@/components/ui/Button";

<Button variant="primary" size="lg">Se connecter</Button>
<Button variant="secondary" size="md">Retour</Button>
<Button variant="destructive" size="sm">Supprimer</Button>
<Button variant="ghost">Annuler</Button>
<Button loading>Chargement…</Button>
<Button fullWidth>Pleine largeur</Button>
<Button iconLeft={<Plus />}>Ajouter</Button>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `primary \| secondary \| ghost \| destructive \| link` | `primary` |
| `size` | `sm \| md \| lg` | `md` |
| `loading` | `boolean` | `false` |
| `fullWidth` | `boolean` | `false` |
| `iconLeft` | `ReactNode` | — |
| `iconRight` | `ReactNode` | — |

Heights: sm=32px, md=40px, lg=48px.

---

### Input

```tsx
import { Input } from "@/components/ui/Input";

<Input
  label="Adresse email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="vous@exemple.com"
  iconLeft={<Mail className="h-4 w-4" />}
  helperText="Votre email professionnel"
  errorMessage={errors.email}
  autoComplete="email"
/>
```

| Prop | Type |
|------|------|
| `label` | `string` |
| `iconLeft / iconRight` | `ReactNode` |
| `helperText` | `string` |
| `errorMessage` | `string` |
| + all native `<input>` props | — |

Variants derived automatically: default (neutral-300 border), error (error-500 border), success (success-500 border).  
Focus ring: `ring-primary-500`.

---

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

<Card interactive>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Contenu…</CardContent>
  <CardFooter>Pied de carte</CardFooter>
</Card>
```

`interactive` adds `hover:border-neutral-300 hover:shadow-sm cursor-pointer`.

---

### Badge

```tsx
import { Badge, StatusBadge } from "@/components/ui/Badge";

<Badge variant="success">Vérifié</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="error">Rejeté</Badge>
<Badge variant="primary">Nouveau</Badge>
<Badge variant="neutral">Brouillon</Badge>

// Typed status badge (web-patient only):
<StatusBadge status="COMPLETED" />
```

---

### Modal

```tsx
import { Modal, ModalFooter } from "@/components/ui/Modal";

<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Confirmer l'action"
  description="Cette action est irréversible."
>
  <p>Contenu du modal</p>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
    <Button variant="destructive" onClick={handleConfirm}>Confirmer</Button>
  </ModalFooter>
</Modal>
```

Built on Radix UI Dialog. Overlay: `backdrop-blur-sm bg-neutral-900/40`.

---

### Avatar

```tsx
import { Avatar } from "@/components/ui/Avatar";

<Avatar src={user.photoUrl} fallback="FA" size="lg" />
```

| Prop | Type | Default |
|------|------|---------|
| `src` | `string \| null` | — |
| `fallback` | `string` | First two chars of name |
| `size` | `sm \| md \| lg \| xl` | `md` |

Sizes: sm=32px, md=40px, lg=48px, xl=64px.

---

### Stat

```tsx
import { Stat } from "@/components/ui/Stat";

<Stat label="Consultations" value="124" trend="+8% ce mois" trendPositive />
```

---

### Skeleton

```tsx
import { Skeleton, StatsSkeleton } from "@/components/ui/Skeleton";

<Skeleton className="h-4 w-48" />
<StatsSkeleton />
```

---

### Toast (Sonner)

```tsx
import { toast } from "sonner";

toast.success("Profil mis à jour");
toast.error("Erreur lors de la sauvegarde");
toast("Information neutre");
```

`<Toaster>` is mounted in `app/layout.tsx`. Custom style: white bg, neutral-200 border, rounded-xl.

---

## Navigation

### TopBar

```tsx
import { TopBar } from "@/components/navigation/TopBar";

<TopBar minimal />   // auth pages — logo only
<TopBar />          // default — logo + nav links + auth buttons
```

### BottomNav (web-patient only)

Mobile bottom navigation with 4 tabs. Active state: `text-primary-700` with top border indicator.

---

## Rules d'or

1. **3 couleurs max par écran** — primary, neutral, + one semantic. Never mix primary + success + warning at once.
2. **Whitespace généreusement** — sections: `py-20 md:py-28`. Cards: `p-6`. Forms: `space-y-4`.
3. **Borders, pas shadows** — default card state is border-only (`border-neutral-200`). Shadow appears only on hover or elevation (modal, dropdown).
4. **Typographie sans hiérarchie excessive** — 2 font weights max per view: `font-medium` (500) and `font-semibold` (600). Bold (700) only for hero + stat numbers.
5. **Pas de blobs** — max `rounded-xl` (12px) on containers. Icons use `rounded-full` only for avatar/pill shapes.
6. **Mobile-first** — référence 375px. Tout doit être utilisable sans overflow horizontal.
7. **Focus visible partout** — `:focus-visible` ring 2px primary-500 + offset-2. Jamais `outline: none` sans alternative.
8. **Icons Lucide uniquement** — stroke-width 1.5 (default), size `h-4 w-4` (inline) or `h-5 w-5` (standalone).
9. **Toasts pour confirmations, pas d'états inline** — remplacer les `successMessage` states par `toast.success()`.
10. **Animations courtes** — `duration-150` pour transitions de couleur, `duration-200` pour apparitions.

---

---

## Components (Brique 8 additions)

### StarRating (web-patient only)

```tsx
import { StarRating } from "@/components/ui/StarRating";

// Interactive
<StarRating value={rating} onChange={setRating} size="lg" />

// Read-only
<StarRating value={4} readOnly size="sm" />
```

| Prop | Type | Default |
|------|------|---------|
| `value` | `number` | — |
| `onChange` | `(v: number) => void` | — |
| `readOnly` | `boolean` | `false` |
| `size` | `sm \| md \| lg` | `md` |

Stars fill with `warning-500` on hover/select. Hover includes `scale-110` transition.

---

### SectionTitle (both apps)

```tsx
import { SectionTitle } from "@/components/ui/SectionTitle";

<SectionTitle title="Consultations récentes" action={{ label: "Voir tout", href: "/consultations" }} />
<SectionTitle title="Disponibilité" action={{ label: "Modifier", onClick: handleEdit }} />
```

Renders `h2` left + optional link/button right. Link uses Next.js `<Link>`, button uses `onClick`.

---

### Switch (web-doctor only)

```tsx
import { Switch } from "@/components/ui/Switch";

<Switch
  checked={doctor.isAvailable}
  onCheckedChange={(checked) => setOverride({ isAvailable: checked })}
  size="md"
/>
```

| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | — |
| `onCheckedChange` | `(v: boolean) => void` | — |
| `disabled` | `boolean` | `false` |
| `size` | `sm \| md` | `md` |

Track: `bg-primary-500` when on, `bg-neutral-300` when off. Focus ring: `ring-primary-500`.

---

### KpiCard (web-doctor only)

```tsx
import { KpiCard } from "@/components/ui/KpiCard";

<KpiCard label="Consultations" value="14" subLabel="aujourd'hui" />
<KpiCard label="Score qualité" value="4.7" trend={0.3} trendLabel="vs mois dernier" />
<KpiCard label="Patients référents" value={data?.count ?? "—"} subLabel="vous ont désigné" />
```

| Prop | Type | Notes |
|------|------|-------|
| `label` | `string` | Uppercased by CSS (tracking-wider) |
| `value` | `string \| number` | Large bold number |
| `subLabel` | `string` | Shown when no trend |
| `trend` | `number` | Shows TrendingUp/Down icon + color |
| `trendLabel` | `string` | Appended to trend value |

Positive trend: `text-success-700`. Negative: `text-error-700`.

---

## Package dependencies

| Package | Version | Use |
|---------|---------|-----|
| `tailwindcss` | ^3 | Utility classes |
| `class-variance-authority` | ^0.7 | CVA component variants |
| `clsx` + `tailwind-merge` | ^2 / ^2 | `cn()` utility |
| `@radix-ui/react-dialog` | ^1 | Modal |
| `@radix-ui/react-tabs` | ^1 | Tabbed pages (profile) |
| `sonner` | ^1 | Toast notifications |
| `lucide-react` | ^0.400+ | Icons |
| `next/font/google` | built-in | Plus Jakarta Sans |
