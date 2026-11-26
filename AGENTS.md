# AGENTS.md : Élite Sport Godomey

Application de réservation pour **un seul terrain de football** : Élite Sport Godomey, Godomey, Cotonou (Bénin), ouvert 24h/24. Les équipes consultent les créneaux libres et réservent depuis leur téléphone ; le gérant gère le planning. Public visé : smartphones Android d'entrée de gamme, connexion instable, WhatsApp et Mobile Money omniprésents.

## Stack

- **Next.js 15 (App Router)** + React 19 + TypeScript strict : front et backend dans un seul projet (Server Actions, Route Handlers).
- **Tailwind CSS v4** (tokens dans `src/app/globals.css`), polices Barlow et Barlow Condensed via `next/font`.
- **Drizzle ORM** + **PostgreSQL hébergé sur Supabase**, utilisé uniquement comme base de données (pas de SDK Supabase, pas d'auth Supabase, pas de Realtime).
- **Zod** pour valider toute entrée serveur.
- **Better Auth** (prévu, Phase 1b) : e-mail + mot de passe pour le gérant, rôle `admin`. Les équipes n'ont pas de compte.
- **Paiement** (prévu, Phase 2) : KkiaPay ou FedaPay, paiement plein Mobile Money (MTN, Moov), confirmation après paiement complet par webhook.
- Déploiement : Vercel.

## Commandes

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Variables d'environnement (voir `.env.example`) : `DATABASE_URL` (pooler Supabase, port 6543), `NEXT_PUBLIC_MANAGER_WHATSAPP`. Ne jamais committer `.env.local`.

## Structure

```
src/app/          pages (page publique de réservation, futur /admin)
src/actions/      Server Actions (reserve.ts)
src/components/   composants UI (SlotPicker.tsx est un Client Component)
src/db/           schema.ts (Drizzle) et index.ts (connexion)
src/lib/          bookings.ts (logique créneaux), pricing.ts (tarifs)
sql/              migrations SQL à exécuter à la main dans Supabase
```

## Règles métier à ne pas casser

1. **Anti-double réservation au niveau base de données.** La contrainte `bookings_no_overlap` (`EXCLUDE USING gist` sur `tstzrange(starts_at, ends_at)`, limitée aux statuts `pending` et `confirmed`) est la source de vérité. Ne jamais la remplacer par une simple vérification applicative. En cas de violation (code Postgres `23P01`), renvoyer un message clair à l'utilisateur.
2. **Fuseau horaire.** Le Bénin est en UTC+1 toute l'année, sans heure d'été. Stocker en `timestamptz`, construire les créneaux avec l'offset `+01:00`, afficher en `Africa/Porto-Novo`. Ne jamais utiliser le fuseau du serveur (Vercel est en UTC).
3. **Créneaux de 1 heure, 24 par jour** (00h à 23h). Un créneau de 23h–0h finit le lendemain : toujours raisonner avec des dates complètes, jamais avec des heures seules.
4. **Expiration sans cron.** Les réservations `pending` dont `expires_at` est dépassé sont annulées au début de chaque lecture ou création (`expireStale()`). Garder ce mécanisme.
5. **Statuts** : `pending` (bloqué 15 min, en attente de paiement), `confirmed`, `cancelled`, `completed`. Source : `online` ou `manual` (saisie par le gérant).
6. **Tarifs** centralisés dans `src/lib/pricing.ts` (paiement plein : 25 000 FCFA par heure, 24h/24, pas d'acompte). Ne pas dupliquer de montants ailleurs. Montants en entiers FCFA, sans décimales.
7. **Téléphones** : accepter les formats béninois (8 chiffres ancien format, 10 chiffres avec le préfixe `01`, avec ou sans `+229`).

## Sécurité

- Le navigateur ne parle jamais à la base : tout passe par Server Actions ou Route Handlers.
- RLS activé sans politique sur toutes les tables Supabase (la clé publique ne doit rien pouvoir lire). Toute nouvelle table doit recevoir `ENABLE ROW LEVEL SECURITY`.
- Valider avec Zod chaque entrée (FormData, JSON, query params).
- Pages et actions du gérant : vérifier la session **et** le rôle `admin` côté serveur, jamais seulement dans l'UI.
- Webhook de paiement : ne pas faire confiance au corps reçu. Revérifier la transaction auprès de l'API de l'agrégateur avant de passer une réservation en `confirmed`. Rendre le traitement idempotent.
- Connexion Postgres : garder `prepare: false` (pooler en mode transaction).

## Conventions de code

- Code, noms de variables et commits en **anglais** ; textes affichés à l'utilisateur en **français**.
- Server Components par défaut ; `"use client"` seulement pour l'interactivité.
- Les modifications de schéma passent par un nouveau fichier `sql/00N_*.sql` **et** la mise à jour de `src/db/schema.ts`.
- Pas de dépendance lourde sans raison : le poids de la page compte (réseaux mobiles lents).
- Pas de `any` ajouté sans justification ; pas de `localStorage` pour des données métier.

## Design

Identité inspirée du terrain réel (herbe synthétique, lignes orange). Tokens : `turf` #1f5d3a (vert), `line` #e8590c (orange des lignes du terrain), `chalk` #f8f7f2 (fond), `ink` #16231b (texte). Titres en Barlow Condensed, texte en Barlow. Mobile first : tout doit être utilisable à 360 px de large avec une main. Boutons larges, contraste élevé, focus visible. Messages d'erreur : dire ce qui s'est passé et quoi faire, sans s'excuser.

## Feuille de route

- [x] Phase 1 : page publique (jours, créneaux, réservation avec blocage 15 min, confirmation WhatsApp)
- [ ] Phase 1b : Better Auth + espace gérant (planning, réservation manuelle, annulation, blocage de créneaux, tarifs)
- [ ] Phase 2 : paiement plein Mobile Money (KkiaPay ou FedaPay), webhook, confirmation après paiement complet
- [ ] Phase 3 : rappels WhatsApp/SMS, tableau de bord des revenus, historique, PWA installable, réservation multi-heures

## Avant de terminer une tâche

Vérifier que `npm run build` passe, que le parcours « choisir un créneau, réserver » fonctionne à 360 px, et qu'aucune règle métier ci-dessus n'est contournée.
