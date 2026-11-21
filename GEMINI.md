# GEMINI.md : Élite Sport Godomey

@./AGENTS.md

## Consignes spécifiques à Gemini CLI

- Le fichier `AGENTS.md` importé ci-dessus est la référence unique du projet (stack, règles métier, sécurité, conventions). En cas de conflit, il prévaut.
- Réponds à l'utilisateur en **français**, avec un ton simple et direct. Le code et les commits restent en anglais.
- Avant de modifier la base de données, relis `sql/001_bookings.sql` et `src/db/schema.ts`, et propose le nouveau fichier SQL avant de l'appliquer.
- Avant d'écrire du code Next.js, rappelle-toi : version 15, `searchParams` est une `Promise`, React 19 (`useActionState`), Tailwind v4 (pas de `tailwind.config.js`).
- Ne lance jamais de commande qui écrit dans la base de production. Pour tester, utilise une base Supabase de développement.
- Fais des changements petits et vérifiables : une fonctionnalité à la fois, puis `npm run build`.
- Si une information métier manque (tarif, durée, règle d'annulation), pose la question au lieu de l'inventer.
