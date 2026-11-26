# Élite Sport Godomey — Design System & Landing Contract

> **Statut.** Extraction du système existant et contrat de design pour la page publique `/`, la page de réservation `/reserver` et les pages légales. Ce document ne modifie aucun fichier source, de configuration ou de paquet.
>
> **Périmètre.** Un seul terrain de football à Godomey, Cotonou, Bénin, ouvert 24h/24. Créneaux d'une heure, réservation depuis un smartphone Android d'entrée de gamme, paiement intégral de 25 000 FCFA avant confirmation, WhatsApp en solution de repli.
>
> **Direction.** « Terrain & lignes » : un fond de craie, des lignes de terrain orange tracées avec retenue, le vert du terrain pour l'action principale, des titres Barlow Condensed. Pas de photos inventées, pas de preuves inventées.
>
> **Section 0 absente.** Ce document n'est pas un greenfield : la section 0 (Research Log) est volontairement omise. Les sources réellement lues sont listées en section 9.

---

## 1. Atmosphere & Identity

L'identité vient du terrain réel, pas d'un catalogue de landing pages. La page doit donner l'impression d'arriver au bord du terrain : une surface claire, des lignes franches, une lumière de fin d'après-midi, puis un seul geste utile — voir les créneaux.

- **Signature.** Une ou deux lignes de terrain orange, épaisses et nettes, se tracent une seule fois à l'arrivée. Elles restent statiques ensuite. Le vert `pitch` porte le bouton principal et l'état sélectionné ; l'orange `line` reste un accent de terrain, pas une couleur de texte courant.
- **Matière.** Pas de verre, pas de dégradés décoratifs, pas de cartes empilées. Des surfaces tonales, des bordures fines, une ombre unique pour les feuilles collantes. Le dessin est plus proche d'un plan de terrain que d'un tableau de bord SaaS.
- **Rythme.** Une landing narrative en une colonne, avec des respirations franches. La page de réservation reste dense et opérationnelle : elle doit tenir à 360 px et se lire d'une main.
- **Ton.** Direct, utile, sans emphase. Les textes disent ce qui se passe et quoi faire. Pas de « solution innovante », pas de superlatifs, pas de fausse preuve sociale.
- ** Ce qui est exclu.** Témoignages, compteurs de réservations, logos de partenaires, photos de terrain inventées, cartes de fonctionnalités en grille, animations en boucle, parallaxe, vidéo automatique.

## 2. Color

### 2.1 Palette et rôles sémantiques

Les quatre tokens historiques sont conservés tels quels : `pitch`, `line`, `canvas`, `ink`. Les autres rôles sont des alias sémantiques destinés au nouveau travail. Les valeurs sombres sont documentées pour préparer un thème sombre, **pas implémentées dans cette phase**.

| Rôle | Token | Light | Dark | Usage | Contraste vérifié |
|---|---|---|---|---|---|
| Marque / terrain | `--color-pitch` | `#1f5d3a` | `#2f7a4f` | CTA principal, jour actif, état confirmé | `#ffffff` sur `#1f5d3a` = **7.82:1** ; `#ffffff` sur `#2f7a4f` = **5.23:1** |
| Marque / terrain hover | `--color-pitch-hover` | `#17482c` | `#276a44` | Survolement et enfoncement du CTA | `#ffffff` sur `#17482c` = **10.50:1** ; `#ffffff` sur `#276a44` = **6.50:1** |
| Marque / ligne | `--color-line` | `#e8590c` | `#ff8a4c` | Lignes de terrain, filet supérieur, grands accents décoratifs | `#e8590c` sur `#f8f7f2` = **3.34:1** (décoratif/grand texte uniquement) ; `#ff8a4c` sur `#101a13` = **7.63:1** |
| Marque / ligne forte | `--color-line-strong` | `#b84304` | `#ffb08a` | Petits textes orange, bordure d'alerte, lien fort | `#b84304` sur `#f8f7f2` = **5.09:1** ; `#ffb08a` sur `#101a13` = **10.03:1** |
| Marque / sur ligne | `--color-on-line` | `#16231b` | `#101a13` | Texte ou icône posés sur un remplissage orange | `#16231b` sur `#e8590c` = **4.55:1** ; `#101a13` sur `#ff8a4c` = **6.97:1** |
| Surface / canvas | `--color-canvas` | `#f8f7f2` | `#101a13` | Fond de page | `#16231b` sur `#f8f7f2` = **15.17:1** ; `#f8f7f2` sur `#101a13` = **16.60:1** |
| Surface / carte | `--color-surface-card` | `#ffffff` | `#16231b` | Cartes, champs, contenu de feuille | `#16231b` sur `#ffffff` = **16.27:1** ; `#f8f7f2` sur `#16231b` = **15.17:1** |
| Surface / élevée | `--color-surface-elevated` | `#ffffff` | `#1c2a21` | Feuille collante, dialogue | `#16231b` sur `#ffffff` = **16.27:1** ; `#f8f7f2` sur `#1c2a21` = **13.96:1** |
| Surface / atténuée | `--color-surface-muted` | `#efeee8` | `#24382c` | Créneaux pris ou passés, zones désactivées | `#16231b` sur `#efeee8` = **14.00:1** ; `#f8f7f2` sur `#24382c` = **11.67:1** |
| Texte / primaire | `--color-text-primary` | `#16231b` | `#f8f7f2` | Titres et corps | **15.17:1** ; **16.60:1** |
| Texte / secondaire | `--color-text-secondary` | `#3c4a41` | `#cbd4cd` | Sous-titres, métadonnées | `#3c4a41` sur `#f8f7f2` = **8.71:1** ; `#cbd4cd` sur `#101a13` = **11.74:1** |
| Texte / tertiaire | `--color-text-tertiary` | `#5a665d` | `#a9b5ac` | Légendes et aides | `#5a665d` sur `#f8f7f2` = **5.60:1** ; `#a9b5ac` sur `#101a13` = **8.39:1** |
| Bordure / subtile | `--color-border-subtle` | `#e2e1da` | `#2a3b30` | Séparateurs décoratifs uniquement | Non requise pour un contrôle ; ne pas l'utiliser comme seule bordure de champ |
| Bordure / forte | `--color-border-strong` | `#6b7a70` | `#5b7263` | Bordure de champ et de contrôle | `#6b7a70` sur `#f8f7f2` = **4.22:1** ; `#5b7263` sur `#101a13` = **3.42:1** |
| Focus / anneau | `--color-focus-ring` | `#b84304` | `#ffb08a` | Anneau de focus 2 px + halo 2 px | `#b84304` sur `#f8f7f2` = **5.09:1** ; `#ffb08a` sur `#101a13` = **10.03:1** |
| Statut / erreur | `--color-status-error` | `#9e3602` | `#ff9a62` | Erreurs, échec de connexion | `#9e3602` sur `#f8f7f2` = **6.56:1** ; `#ff9a62` sur `#101a13` = **8.52:1** |
| Statut / succès | `--color-status-success` | `#1f5d3a` | `#8fd3a8` | Confirmation, créneau confirmé | `#1f5d3a` sur `#f8f7f2` = **7.29:1** ; `#8fd3a8` sur `#101a13` = **10.22:1** |
| Statut / avertissement | `--color-status-warning` | `#b84304` | `#ffb08a` | Avertissement, champ « À compléter » | **5.09:1** ; **10.03:1** |
| Texte / sur accent | `--color-on-accent` | `#ffffff` | `#ffffff` | Texte sur remplissage `pitch` | **7.82:1** ; **5.23:1** |

### 2.2 Règles

- **L'orange n'est jamais une couleur de texte courant sur `canvas`.** `#e8590c` sur `#f8f7f2` ne fait que 3.34:1 : réservé aux lignes, filets, grands aplats décoratifs et grands titres. Pour un petit texte orange, utiliser `--color-line-strong` (5.09:1).
- **Le vert `pitch` porte l'action.** Un seul bouton principal par écran. Le survolement passe à `pitch-hover`; l'état désactivé utilise `surface-muted` avec texte `text-tertiary`, jamais un vert translucide.
- **La sélection n'est pas un contour orange.** Un créneau sélectionné est rempli de `pitch`, avec texte `chalk` et une coche. L'orange reste la ligne du terrain, pas l'état d'un contrôle.
- **Les statuts ne reposent pas sur la couleur seule.** Toujours associer texte + icône ou forme. « Pris » et « Passé » restent lisibles sans couleur.
- **Les tokens sombres ne sont pas branchés.** Aucun `prefers-color-scheme` ni bascule de thème n'est requis dans cette phase. Les valeurs sombres servent de réserve documentée.
- **Dette de couleurs existante.** `#9e3602`, `#b84304`, `#17482c`, `#c94705`, `#b23d03`, `#cf4c07`, `#24382c` apparaissent encore en dur dans les composants. Ne pas les réutiliser dans le nouveau travail ; les remplacer par les tokens ci-dessus lors du refactor.
- **Pas de dégradé de marque.** Le fond est `canvas`; les surfaces sont des aplats. La profondeur vient des bordures et d'une ombre de feuille, pas d'un glassmorphism.

## 3. Typography

### 3.1 Échelle

| Niveau | Police | Taille | Graisse | Interlignage | Interlettrage | Usage |
|---|---|---|---|---|---|---|
| Display | Barlow Condensed | 40 px / 2.5rem | 700 | 0.95 | -0.01em | Titre de landing sur 360 px |
| H1 | Barlow Condensed | 32 px / 2rem | 700 | 1.0 | -0.01em | Titre de page, titre légal |
| H2 | Barlow Condensed | 24 px / 1.5rem | 600 | 1.05 | 0 | Sections de landing, titres de journée |
| H3 | Barlow Condensed | 18 px / 1.125rem | 600 | 1.15 | 0 | Sous-sections, titres de feuille |
| Body | Barlow | 16 px / 1rem | 400 | 1.5 | 0 | Texte courant |
| Body strong | Barlow | 16 px / 1rem | 600 | 1.5 | 0 | Prix, noms de créneaux, accents |
| Small | Barlow | 14 px / 0.875rem | 400 | 1.4 | 0 | Métadonnées, aides, prix courants |
| Caption | Barlow | 12 px / 0.75rem | 500 | 1.35 | 0.01em | Légendes uniquement, jamais un prix ou une action |

### 3.2 Règles

- **Barlow Condensed pour les titres, Barlow pour le reste.** Les deux sont déjà chargées via `next/font` avec les variables `--font-barlow` et `--font-barlow-condensed`. Ne pas ajouter de troisième police.
- **Graisses disponibles.** Barlow 400/500/600/700 ; Barlow Condensed 600/700. Ne pas demander une graisse non chargée.
- **Prix et heures en chiffres tabulaires.** `font-variant-numeric: tabular-nums` sur les montants, les heures et le compte à rebours pour éviter les sauts de largeur.
- **14 px est le plancher du texte utile.** Les 12 px sont réservés aux légendes non essentielles. Un prix, un libellé de créneau ou un bouton ne descend jamais à 12 px.
- **Pas de texte en capitales longues.** Les capitales sont réservées aux micro-libellés de section (par exemple `TARIFS`) avec un interlettrage léger, jamais à un paragraphe.
- **Les titres ne portent pas l'information seule.** Un H2 de section doit être suivi d'un texte ou d'un contrôle qui explique l'action.

## 4. Spacing & Layout

### 4.1 Unité et échelle

- **Base 4 px.** Échelle autorisée : 4, 8, 12, 16, 24, 32, 48, 64 px. Pas de valeurs arbitraires dans les nouveaux composants.
- **Gouttières mobiles.** 14 px à 360 px, 16 px dès 400 px. Les bords de section ne descendent pas sous 14 px.
- **Hauteur de section.** Landing : 48 px mobile, 64 px desktop. Héros : 64 px mobile, 96 px desktop. Pages légales : 32 px mobile, 48 px desktop.
- **Largeur de contenu.** Landing et réservation : `max-width: 1024px`. Pages légales et confirmation : `max-width: 36rem` (environ 576 px), pour une longueur de ligne confortable.

### 4.2 Grille et points de rupture

- **Mobile first, 360 px comme largeur de référence.** Aucun contenu ne doit provoquer un défilement horizontal à 360 px.
- **Points de rupture.** 640 px, 768 px, 1024 px. La grille de créneaux passe de 3 à 4 puis 6 colonnes ; la landing reste en une colonne jusqu'à 768 px.
- **Une seule zone de défilement par axe.** La roue des jours peut défiler horizontalement ; le document ne défile jamais horizontalement. La feuille de réservation est fixe en bas mais le document reste défilable derrière.
- **Zone sûre.** La feuille collante réserve `env(safe-area-inset-bottom)` et un padding bas de 96 px sur le document pour ne pas masquer le dernier créneau.
- **Fuseau horaire.** Les créneaux sont construits avec l'offset `+01:00` et affichés en `Africa/Porto-Novo`. Ne jamais utiliser le fuseau du serveur (Vercel est en UTC). Un créneau 23h–0h finit le lendemain : toujours manipuler des dates complètes.

### 4.3 Layout lines

```text
Layout: stack (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/stacking/stack.md) + center (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/centering/center.md) + box (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/containment/box.md)
Layout: center (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/centering/center.md) + stack (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/stacking/stack.md) + reel (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/in-line-grouping/reel.md) + ram-grid (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/grid-repetition/ram-grid.md) + imposter (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/overlay-exception/imposter.md)
Layout: center (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/centering/center.md) + content-limiter (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/containment/content-limiter.md) + stack (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/stacking/stack.md)
Layout: center (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/centering/center.md) + content-limiter (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/containment/content-limiter.md) + stack (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/stacking/stack.md)
Layout: center (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/centering/center.md) + content-limiter (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/containment/content-limiter.md) + stack (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/stacking/stack.md)
Layout: center (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/centering/center.md) + content-limiter (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/containment/content-limiter.md) + stack (https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/stacking/stack.md)
```

Correspondance, dans l'ordre : `/`, `/reserver`, `/legals`, `/legals/mentions-legales`, `/legals/confidentialite`, `/legals/cgu`.

### 4.4 Règles de composition

- **Une action principale par écran.** Sur `/`, le seul bouton primaire est « Voir les créneaux » vers `/reserver`. Le bouton d'installation PWA et les liens légaux sont secondaires ou discrets.
- **Pas de header collant sur la landing.** Le header est statique. La feuille de réservation est le seul élément fixe, et uniquement quand elle est ouverte.
- **Pas de grille de cartes marketing.** La landing est une narration verticale : offre, étapes, tarifs, réassurance, pied de page. Les cartes ne servent qu'à des objets répétés (jours, créneaux) ou à une feuille.
- **Pas de footer sur la page de réservation avant la fin du parcours.** La page de réservation garde son footer légal commun, mais il ne doit pas concurrencer la feuille collante.
- **Le contenu légal est un texte, pas un dashboard.** Une colonne, 65–75 caractères par ligne, titres hiérarchisés, sommaire ancré. Pas de cartes, pas d'illustrations.

## 5. Components

### 5.1 Landing screen brief (`/`)

**Objectif.** Faire comprendre en moins de dix secondes : quel terrain, où, ouvert 24h/24, comment réserver, combien ça coûte, et où aller pour réserver.

**Action principale unique.** `Voir les créneaux` → `/reserver`. C'est le seul bouton primaire de l'écran. Le header peut contenir l'installation PWA (secondaire) ; le footer ne répète pas le CTA.

**Priorités d'information.**

1. L'offre : un terrain de football à Godomey, Cotonou, Bénin, ouvert 24h/24, créneaux d'une heure.
2. Le déroulé : choisir un créneau, le bloquer 15 minutes, payer le montant intégral avant confirmation.
3. Le prix et la réassurance : 25 000 FCFA par heure, jour et nuit, paiement intégral avant confirmation, liens légaux.

**Contenu requis.**

- H1 : `Le terrain de Godomey, ouvert 24h/24.`
- Sous-titre : `Élite Sport Godomey — Godomey, Cotonou, Bénin. Un créneau d'une heure, réservé depuis votre téléphone.`
- CTA : `Voir les créneaux`.
- Trois étapes numérotées : `Choisissez un jour et un créneau d'une heure.` / `Bloquez-le 15 minutes et indiquez le nom de votre équipe.` / `Payez le montant intégral avant confirmation.`
- Tarifs : `25 000 FCFA par heure, jour et nuit`, avec `Paiement intégral avant confirmation`.
- Réassurance : `Réservation en ligne, paiement intégral avant confirmation.` + liens légaux.
- Footer : marque, `Godomey, Cotonou, Bénin`, liens `/legals`, `/legals/mentions-legales`, `/legals/confidentialite`, `/legals/cgu`.

**Volontairement exclus.** Témoignages, notes, nombre de réservations, logos, photos de terrain, vidéos, cartes de fonctionnalités, comparaison d'offres, urgence artificielle, pop-up d'inscription.

**Data shape → composant.**

| Contenu | Forme | Composant |
|---|---|---|
| Offre et lieu | texte + petit bloc de faits | `LandingHero` + `PageHeader` |
| Déroulé | liste ordonnée de 3 étapes | `BookingSteps` |
| Tarifs | liste de définitions (`dl`) | `PriceStrip` |
| Réassurance | paragraphe + liens | `InlineAlert` (info) ou texte simple + `LegalFooter` |
| Action | lien/bouton | `ActionButton` variante primaire |

**Captures avant.** `/home/niceboy/Elitesport/.playwright-mcp/before-home-390.png`, `/home/niceboy/Elitesport/.playwright-mcp/before-home-1440.png`, `/home/niceboy/Elitesport/.playwright-mcp/page-2026-11-18T14-36-23-383Z.yml`.

### 5.2 Booking screen brief (`/reserver`)

**Objectif.** Choisir un jour, choisir un créneau, le bloquer 15 minutes, laisser le nom de l'équipe et le téléphone, puis payer le montant intégral avant confirmation. WhatsApp reste une solution de repli. La page actuelle à `/` devient `/reserver` sans changer les règles métier.

**Contraintes métier visibles.**

- Créneaux d'une heure, 24 par jour, de 00h à 23h. Un créneau 23h–0h finit le lendemain.
- Blocage `pending` de 15 minutes, puis expiration. `expireStale()` reste appelé au début de chaque lecture ou création.
- Prix : 25 000 FCFA par heure, jour et nuit. Paiement intégral de 25 000 FCFA avant confirmation. Montants entiers FCFA, sans décimales.
- Téléphones béninois acceptés : 8 chiffres ancien format, 10 chiffres avec préfixe `01`, avec ou sans `+229`.
- Anti-double réservation : la contrainte `bookings_no_overlap` reste la source de vérité. Une violation PostgreSQL `23P01` affiche un message clair, jamais un écran blanc.
- Confirmation WhatsApp : le message contient le créneau, le tarif total et le montant à payer (25 000 FCFA). Le lien WhatsApp est une action secondaire, jamais un substitut au statut de réservation.

**États de paiement affichés.**

| État | Déclencheur | Ce que voit l'utilisateur | Statut réservation |
|---|---|---|---|
| `awaiting_payment` | Créneau bloqué, paiement intégral non reçu | `Montant à payer : 25 000 FCFA` ; bouton `Payer le montant complet (25 000 FCFA)` ; rappel `Créneau bloqué 15 minutes le temps d'effectuer le paiement intégral.` | `pending` |
| `payment_received` | Paiement intégral reçu, serveur pas encore à jour | `Paiement intégral reçu. Confirmation en cours…` ; plus aucun bouton de paiement | `pending` puis `confirmed` après vérification serveur |
| `confirmed` | Statut serveur `confirmed` | `Réservation confirmée` ; plus aucun bouton de paiement | `confirmed` |

Le widget ne traite pas un paiement réussi comme une confirmation. Le statut serveur fait foi : `bookingStatus === 'confirmed'` est requis pour afficher `confirmée` et appeler `onVerifiedConfirmed`.

**Hiérarchie.** Header → titre de page + lieu → roue des jours → bandeau tarifs + nombre de créneaux libres → grille de créneaux → feuille de réservation (à l'ouverture) → footer légal.

**Action principale.** Avant sélection : choisir un créneau (l'action est la grille elle-même). Après sélection : `Bloquer ce créneau — 15 min` dans la feuille. Ne pas afficher deux boutons primaires simultanément.

### 5.3 Legal screen brief (`/legals/*`)

**Objectif.** Rendre les informations légales lisibles, honnêtes et faciles à corriger. Les données juridiques ne sont pas fournies : chaque champ manquant est un `À compléter` visible, pas une phrase inventée.

**Routes.**

- `/legals` : index des informations légales, trois liens.
- `/legals/mentions-legales` : éditeur, responsable de publication, statut juridique, adresse complète, contact, hébergeur.
- `/legals/confidentialite` : responsable de traitement, données collectées, finalités, base légale, durée de conservation, destinataires, droits, contact.
- `/legals/cgu` : conditions de réservation, prix, paiement intégral avant confirmation, blocage 15 minutes, annulation et remboursement, responsabilité, droit applicable.

**Composants.** `LegalToc`, `LegalSection`, `PlaceholderField`, `LegalFooter`. Une seule colonne, `content-limiter`, titres H1 → H2, sommaire ancré. Pas de CTA primaire ; un lien discret `Retour aux créneaux` suffit.

**Champs `À compléter` minimaux.** Raison sociale, adresse complète (seul `Godomey, Cotonou, Bénin` est connu), contact e-mail/téléphone, hébergeur, responsable de traitement, durées de conservation, politique d'annulation/remboursement, droit applicable. Le texte final doit être fourni par le gérant ou un juriste ; ce document ne le remplace pas.

### 5.4 Extracted primitives

Ces composants existent déjà sous forme de markup dupliqué. Ils sont nommés ici pour être réutilisés, pas réinventés.

#### `PageHeader`

- **Structure.** Filet supérieur orange de 4 px (`aria-hidden`), marque `Élite Sport Godomey`, ligne de lieu `Godomey, Cotonou, Bénin`, slot à droite pour l'installation PWA ou un lien de retour.
- **Variantes.** Landing (marque + lieu + installation), réservation (marque + lieu + installation), légal (marque + retour), admin (marque + retour).
- **États.** Défaut ; installation disponible ; installation faite (bouton masqué) ; hors ligne (bannière au-dessus) ; compact à 360 px.
- **Accessibilité.** Un seul `h1` par page ; la marque est un lien vers `/` ; le lien d'évitement précède le header ; les liens de retour ont un libellé explicite.
- **Mouvement.** Aucun. Header statique.
- **Layout.** `stack` + `center` ; le filet orange ne porte pas de texte.

#### `ActionButton`

- **Structure.** `<button>` ou `<a>` selon l'action ; libellé + icône facultative ; largeur naturelle ou pleine largeur dans une feuille.
- **Variantes.** `primary` (fond `pitch`, texte `on-accent`), `secondary` (transparent, bordure `border-strong`), `quiet` (texte seul, souligné au survol), `danger` (uniquement pour une annulation confirmée côté gérant).
- **États.** Défaut ; survol ; actif ; focus-visible ; désactivé ; chargement. En chargement : largeur et hauteur conservées, libellé masqué mais accessible, `aria-busy="true"`, action non réexécutable.
- **Accessibilité.** Cible minimale 44 × 44 px, 48 px pour l'action principale ; focus 2 px + offset 2 px ; jamais de `div` cliquable ; le libellé reste lisible en chargement via `aria-label` ou texte masqué.
- **Mouvement.** Couleurs 120 ms ; enfoncement `scale(0.99)` 80 ms ; rien sous `prefers-reduced-motion`.
- **Layout.** `cluster` implicite : 8 px entre icône et texte ; dans une feuille, pleine largeur.

#### `DayPicker` (roue des jours)

- **Structure.** Section avec H2 `Choisir un jour` et date active ; liste horizontale de boutons jour (nom court, numéro, mois).
- **Variantes.** Aujourd'hui, demain, jour futur, jour complet.
- **États.** Défaut ; sélectionné ; survol ; focus-visible ; chargement ; erreur de chargement avec `Réessayer`.
- **Accessibilité.** `aria-pressed` sur chaque jour ; navigation clavier ; pas de sélection par glissement uniquement ; le jour actif est aussi indiqué par un texte complet sous la roue.
- **Mouvement.** Translation de la roue 150 ms ; pas d'inertie custom ; reduced motion : saut direct.
- **Layout.** `reel` : débordement horizontal autorisé, jamais le document.

#### `SlotCard`

- **Structure.** Bouton avec heure, état, prix si utile, coche si sélectionné.
- **Variantes.** Libre, sélectionné, pris, passé, chargement, erreur.
- **États.** Libre : `surface-card`, bordure `border-subtle`, texte `text-primary`. Sélectionné : `pitch`, texte `on-accent`, coche. Pris/passé : `surface-muted`, texte `text-tertiary`, `disabled`, mention `Pris` ou `Passé`. Chargement : squelette à hauteur fixe + `aria-busy`. Erreur : message local + `Réessayer`.
- **Accessibilité.** Libellé complet `18h–19h, 7 500 FCFA, libre` ; `aria-pressed` ; les créneaux indisponibles restent dans le DOM avec leur statut ; cible 44 px minimum.
- **Mouvement.** Couleurs 120 ms ; pas de rebond ; reduced motion : instantané.
- **Layout.** `ram-grid` : 3 colonnes à 360 px, 4 à 640 px, 6 à 1024 px ; 8 px de gouttière ; hauteur minimale 78 px.

#### `PriceStrip`

- **Structure.** Bandeau de faits tarifaires, pas une carte : prix horaire, paiement intégral avant confirmation, blocage 15 minutes, nombre de créneaux libres.
- **Variantes.** Réservation, landing (version courte).
- **États.** Défaut ; chargement (`Mise à jour…`) ; hors ligne ; aucun créneau (`Aucun créneau libre pour ce jour`).
- **Accessibilité.** Texte à 14 px minimum ; `dl` ou liste ; chiffres tabulaires ; le nombre de créneaux libres est annoncé une fois, pas à chaque frappe.
- **Mouvement.** Aucun.
- **Layout.** `cluster` avec séparateurs verticaux fins ; bordures haut/bas ; pas d'ombre.

#### `BottomSheet`

- **Structure.** Feuille fixe en bas, `role="dialog"`, `aria-labelledby` sur le titre, `aria-describedby` sur le prix et le blocage. Deux contenus : formulaire de réservation et confirmation.
- **Variantes.** Formulaire ; confirmation `pending` ; confirmation `confirmed` ; WhatsApp indisponible.
- **États.** Fermée ; ouverte ; envoi en cours ; erreur ; succès ; expiration du blocage.
- **Accessibilité.** Focus déplacé sur le titre à l'ouverture ; `Échap` ferme ; focus rendu au créneau déclencheur ; feuille non modale (`aria-modal="false"`) pour laisser le contenu derrière atteignable ; `role="status"` pour les messages de succès ; erreurs en `role="alert"` ; le compte à rebours est visible et annoncé à la minute, pas à la seconde.
- **Mouvement.** `translateY(100%) → 0` en 200 ms ; reduced motion : fondu 100 ms ou apparition directe.
- **Layout.** `imposter` fixe en bas ; largeur 100 %, max 640 px centré ; padding bas avec safe area.

#### `InlineAlert`

- **Structure.** Bloc avec icône, titre court et texte ; action facultative.
- **Variantes.** Erreur, avertissement, information, hors ligne.
- **États.** Défaut ; action `Réessayer` en chargement.
- **Accessibilité.** `role="alert"` pour une erreur bloquante ; `role="status"` pour le hors ligne ou une information non urgente ; pas de couleur seule ; contraste `status-*` respecté.
- **Mouvement.** Aucun.
- **Layout.** `box` avec bordure gauche 4 px et padding 12–16 px ; pas de coins arrondis excessifs.

#### `PwaInstallButton`

- **Structure.** Bouton secondaire dans le header, avec icône d'installation ; ouvre une aide iOS si nécessaire.
- **Variantes.** Installable, aide iOS, installé (masqué), refusé (masqué pour la session).
- **États.** Défaut ; survol ; focus-visible ; guide ouvert ; installation en cours.
- **Accessibilité.** Cible 44 px ; libellé explicite ; le guide est un dialogue avec focus géré ; ne pas utiliser le blanc sur orange existant (3.58:1) pour un petit texte.
- **Mouvement.** Aucun.
- **Layout.** Slot à droite du header, `cluster`.

#### `OfflineBanner`

- **Structure.** Bannière au-dessus du header, texte `Hors ligne — vérifiez votre connexion.` et action `Réessayer` si utile.
- **États.** Hors ligne ; reconnexion en cours ; en ligne (masquée).
- **Accessibilité.** `role="status"`, `aria-live="polite"` ; ne masque pas le CTA principal ; contraste `status-warning` ou `status-error`.
- **Mouvement.** Aucun.
- **Layout.** Pleine largeur, `stack`, padding 8–12 px.

### 5.5 New primitives

Ces composants ne sont créés que parce qu'ils sont utilisés au moins deux fois dans le nouveau périmètre.

#### `LegalFooter`

- **Structure.** `<footer>` avec marque, lieu, navigation `Informations légales`, liens `/legals`, `/legals/mentions-legales`, `/legals/confidentialite`, `/legals/cgu`.
- **Utilisation.** Landing, réservation, pages légales, confirmation.
- **États.** Défaut ; survol ; focus-visible.
- **Accessibilité.** `nav aria-label="Informations légales"` ; liens soulignés ; cible 44 px ; ordre cohérent sur toutes les pages.
- **Mouvement.** Aucun.
- **Layout.** `stack` + `center` ; bordure supérieure `border-subtle` ; padding 32–48 px.

#### `LegalToc`

- **Structure.** `<nav aria-label="Sommaire">` avec liste d'ancres vers les H2 de la page.
- **Utilisation.** Les trois pages légales de contenu.
- **États.** Défaut ; survol ; focus-visible ; section courante (`aria-current="location"`).
- **Accessibilité.** Ancres clavier ; pas de sticky qui masque le contenu ; le sommaire ne remplace pas les titres.
- **Mouvement.** Aucun.
- **Layout.** `stack` ; `content-limiter` ; 8 px entre les entrées.

#### `LegalSection`

- **Structure.** `<section aria-labelledby>` avec H2, prose, listes ou `dl`.
- **Utilisation.** Toutes les pages légales.
- **États.** Défaut ; données manquantes (`PlaceholderField`).
- **Accessibilité.** Hiérarchie H1 → H2 ; 65–75 caractères par ligne ; liens explicites ; listes réelles.
- **Mouvement.** Aucun.
- **Layout.** `stack` ; `content-limiter` ; 32 px entre sections.

#### `PlaceholderField`

- **Structure.** Texte visible `À compléter : <champ>` avec bordure pointillée et surface `status-warning` très légère.
- **Utilisation.** Mentions légales, confidentialité, CGU.
- **États.** Défaut uniquement ; ce n'est pas un contrôle interactif.
- **Accessibilité.** Le texte porte l'information, pas la couleur seule ; ne pas utiliser un badge icône seul ; le champ reste lisible en niveau de gris.
- **Mouvement.** Aucun.
- **Layout.** `inline` dans une phrase ou bloc court ; pas de carte.

#### `SkipLink`

- **Structure.** Premier élément focusable de la page : `Aller au contenu principal` → `#main`.
- **Utilisation.** Toutes les pages publiques.
- **États.** Masqué ; visible au focus.
- **Accessibilité.** Contraste élevé, focus visible, pas de déplacement de mise en page au survol.
- **Mouvement.** Aucun.
- **Layout.** Position absolue en haut à gauche, révélée au focus.

### 5.6 Screen compositions

#### `LandingHero`

- **Structure.** H1, sous-titre, faits (24h/24, créneau d'une heure, Godomey), CTA primaire, motif de lignes de terrain en CSS.
- **États.** Défaut ; reduced motion (lignes statiques) ; hors ligne (bannière, CTA toujours visible).
- **Accessibilité.** Un seul H1 ; CTA à 48 px de haut ; pas de texte dans l'image CSS ; le motif est `aria-hidden`.
- **Mouvement.** Lignes `scaleX(0) → scaleX(1)` 600 ms, décalage 80 ms, une seule fois. Pas de boucle.
- **Layout.** `stack` + `center` + `box` ; pas de photo.

#### `BookingSteps`

- **Structure.** Liste ordonnée de trois étapes, numéros visibles, texte court.
- **États.** Défaut ; reduced motion (aucun changement).
- **Accessibilité.** `<ol>` réel ; les numéros ne sont pas le seul repère ; texte à 16 px.
- **Mouvement.** Aucun.
- **Layout.** `stack` sur mobile ; `reel` ou trois colonnes à partir de 768 px.

#### `LegalPage`

- **Structure.** H1, date de mise à jour, `LegalToc`, sections, `PlaceholderField`, lien discret `Retour aux créneaux`, `LegalFooter`.
- **États.** Défaut ; données manquantes ; page introuvable (404).
- **Accessibilité.** `main` unique ; titre de page ; sommaire ; liens de retour ; pas de CTA primaire.
- **Mouvement.** Aucun.
- **Layout.** `center` + `content-limiter` + `stack`.

## 6. Motion & Interaction

- **Principe.** Le mouvement confirme une action ou révèle une ligne de terrain. Il ne décore pas en boucle. Toute animation doit pouvoir être supprimée sans perte d'information.
- **Durées.** Couleurs et bordures 120 ms ; translation de feuille 200 ms ; tracé de ligne 600 ms une seule fois ; décalage 80 ms entre lignes. Pas d'animation au-delà de 600 ms.
- **Propriétés.** `transform` et `opacity` uniquement. Pas de `stroke-dashoffset` animé, pas de `width`/`height` animés, pas de `box-shadow` animé.
- **Réduction.** `@media (prefers-reduced-motion: reduce)` : lignes affichées à l'état final, feuille en fondu 100 ms ou apparition directe, aucun défilement animé, aucun `scale` d'enfoncement.
- **Interactions.** Un clic sur un jour met à jour la roue et la grille ; un clic sur un créneau ouvre la feuille et déplace le focus ; `Échap` ferme ; le focus revient au créneau. Pas de double action sur le même bouton.
- **Compte à rebours.** Pas de pulsation, pas de clignotement. Le temps restant est un texte tabulaire, annoncé à la minute, et l'expiration affiche `Ce blocage a expiré. Choisissez à nouveau un créneau.` avec un lien vers la grille.
- **Chargement.** `aria-busy` sur la zone concernée ; pas de spinner plein écran ; pas de blocage du défilement.
- **Hors ligne.** La bannière est informative, pas bloquante. Le CTA reste visible ; une tentative de réservation hors ligne affiche une erreur avec `Réessayer`.

## 7. Depth & Surface

- **Stratégie.** Mixte : tons de surface + bordures fines. Les cartes ne flottent pas. Une seule ombre est autorisée, pour la feuille collante et le dialogue d'installation.
- **Élévation 0.** Canvas. Pas d'ombre.
- **Élévation 1.** Carte ou champ : `surface-card`, bordure 1 px `border-subtle`, rayon 12 px. Pas d'ombre.
- **Élévation 2.** Feuille collante : `surface-elevated`, bordure 1 px `border-subtle`, rayon 16 px en haut, ombre `0 18px 40px rgb(22 35 27 / 0.16)`.
- **Rayons.** 8 px pour les petits contrôles, 12 px pour les cartes et champs, 16 px pour les feuilles. Pas de pilules décoratives ; les badges de statut utilisent 4 px.
- **Bordures.** 1 px `border-subtle` pour séparer, 2 px `border-strong` pour délimiter un contrôle, 4 px `line` pour le filet de marque ou une alerte.
- **Pas de glassmorphism.** Pas de `backdrop-filter`, pas de transparence décorative, pas de dégradé de fond.
- **Images.** Aucune photo de terrain n'est disponible dans `public/` (uniquement les icônes PWA). Le héros utilise un motif CSS de lignes ; ne pas inventer une photo.

## 8. Accessibility Constraints & Accepted Debt

### 8.1 Contraintes WCAG 2.2 AA

- **1.4.3 Contrast (Minimum), AA.** Texte courant ≥ 4.5:1 ; grand texte ≥ 3:1. Le couple `line` sur `canvas` (3.34:1) n'est utilisé que pour des lignes ou du grand texte. Les petits textes orange utilisent `line-strong` (5.09:1).
- **1.4.11 Non-text Contrast, AA.** Bordures de champs, états de focus, icônes porteuses d'information ≥ 3:1. `border-strong` sur `canvas` = 4.22:1 ; ne pas utiliser `border-subtle` comme seule bordure de contrôle.
- **2.1.1 Keyboard, A.** Tous les jours, créneaux, boutons de feuille, liens légaux et sommaire sont atteignables au clavier. Pas de sélection par glissement uniquement.
- **2.2.1 Timing Adjustable, A.** Le blocage de 15 minutes est une règle métier, pas une limite de lecture. Le temps restant est visible et annoncé sans spam ; l'expiration explique quoi faire. Ne pas ajouter de minuteur sur le formulaire légal.
- **2.3.1 Three Flashes or Below Threshold, A.** Aucun clignotement. Les lignes se tracent une fois ; pas de boucle.
- **2.4.3 Focus Order, A.** Ordre logique : skip link → header → contenu → feuille (à l'ouverture) → footer. Le focus revient au déclencheur à la fermeture.
- **2.4.6 Headings and Labels, AA.** Un H1 par page ; H2 pour les sections ; libellés de champs explicites, pas de placeholder comme seul label.
- **2.4.7 Focus Visible, AA.** Anneau 2 px + offset 2 px, visible sur `canvas`, `pitch` et `surface-card`. Ne pas supprimer l'outline sans remplacement.
- **2.4.11 Focus Not Obscured (Minimum), AA.** La feuille collante ne doit pas recouvrir le champ focalisé ; prévoir un padding bas et un défilement automatique dans la feuille.
- **2.5.7 Dragging Movements, AA.** La roue des jours fonctionne avec des boutons ; pas de drag-and-drop obligatoire.
- **2.5.8 Target Size (Minimum), AA.** Cible ≥ 24 × 24 px ; le projet vise 44 × 44 px, 48 px pour l'action principale.
- **3.2.6 Consistent Help, A.** Les liens légaux et le contact sont au même endroit dans le footer sur toutes les pages publiques.
- **3.3.1 Error Identification, A.** Les erreurs sont textuelles, associées au champ, et disent quoi corriger.
- **3.3.2 Labels or Instructions, A.** Les champs nom d'équipe et téléphone ont un label visible et une aide sur les formats béninois.
- **3.3.7 Redundant Entry, A.** Ne pas redemander le nom de l'équipe ou le téléphone déjà saisi dans le même parcours.
- **4.1.2 Name, Role, Value, A.** Boutons, dialogues, onglets de jours et états `aria-pressed` exposés correctement.
- **4.1.3 Status Messages, AA.** Succès, hors ligne et expiration en `role="status"` ; erreurs bloquantes en `role="alert"`. Le compte à rebours n'annonce pas chaque seconde.

### 8.2 Accepted Debt

| Élément | État actuel | Pourquoi accepté | Suite |
|---|---|---|---|
| Rôles sombres non branchés | Tokens sombres documentés, aucun thème sombre implémenté | Hors périmètre de cette phase ; le light reste la référence | Brancher plus tard sans changer les rôles |
| Contenu légal manquant | Aucune donnée juridique fournie ; champs `À compléter` | Le design ne doit pas inventer des mentions légales | Le gérant ou un juriste fournit les textes avant production |
| PWA installation blanc sur orange | `#ffffff` sur `#e8590c` = 3.58:1 | Composant existant, hors refactor immédiat | Passer au texte `on-line` ou à un fond `line-strong` |
| Focus orange sur vert | Anneau `line` sur `pitch` = 2.18:1 | Dette existante dans les composants | Nouveau travail : anneau chalk/blanc + offset ; refactor ensuite |
| Créneau sélectionné en contour orange | Contour `line` sur carte verte | Dette existante | Nouveau travail : remplissage `pitch` + texte chalk + coche |
| Bandeau tarifs à 12 px | Texte petit dans le composant existant | Dette existante | Nouveau travail : 14 px minimum ; refactor du composant |
| Absence de skip link | Les pages actuelles n'en ont pas | Dette existante | Ajouter dans le layout partagé |
| Compte à rebours `aria-live` bruyant | Annonce potentiellement fréquente | Dette existante | Throttler à la minute et annoncer l'expiration |
| Page de réservation à `/` | Le root est le parcours de réservation | Dette de routage | Déplacer vers `/reserver`, landing sur `/` |
| Métadonnées de landing absentes | Le root décrit la réservation, pas la landing | Dette de contenu | Titre et description propres à `/` |

## 9. Ideal State & Gap Ledger

### 9.1 Sources read in full

- `/home/niceboy/Elitesport/AGENTS.md`
- `/home/niceboy/Elitesport/app/globals.css`
- `/home/niceboy/Elitesport/app/layout.tsx`
- `/home/niceboy/Elitesport/app/page.tsx`
- `/home/niceboy/Elitesport/src/components/BookingExperience.tsx`
- `/home/niceboy/Elitesport/src/components/ReservationSuccessCard.tsx`
- `/home/niceboy/Elitesport/src/components/PWAInstallButton.tsx`
- `/home/niceboy/Elitesport/src/components/OfflineBanner.tsx`
- `/home/niceboy/Elitesport/src/components/AdminLoginForm.tsx`
- `/home/niceboy/Elitesport/app/reservation/[id]/page.tsx`
- `/home/niceboy/Elitesport/src/lib/pricing.ts`
- `/home/niceboy/.cache/opencode/packages/oh-my-openagent/node_modules/oh-my-openagent/dist/skills/frontend/references/design/design-system-architecture.md`
- `/home/niceboy/.cache/opencode/packages/oh-my-openagent/node_modules/oh-my-openagent/dist/skills/frontend/references/design/grounding.md`
- `/home/niceboy/.cache/opencode/packages/oh-my-openagent/node_modules/oh-my-openagent/dist/skills/frontend/references/design/stylegallery.md`
- `/home/niceboy/.cache/opencode/packages/oh-my-openagent/node_modules/oh-my-openagent/dist/skills/frontend/references/designpowers/README.md`
- `/home/niceboy/.cache/opencode/packages/oh-my-openagent/node_modules/oh-my-openagent/dist/skills/frontend/references/designpowers/lane-c-review.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/CATALOG.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/stacking/stack.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/centering/center.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/containment/box.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/in-line-grouping/reel.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/grid-repetition/ram-grid.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/overlay-exception/imposter.md`
- `https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/containment/content-limiter.md`

> WCAG 2.2 a été consulté pour les critères cités (sommaire et extraits ciblés). Le document complet n'a pas été relu intégralement ; les contraintes ci-dessus sont limitées aux SC nommés.

### 9.2 Personas and journey steps

Aucun artifact d'interviews ou de tests utilisateurs n'était disponible. Les personas ci-dessous sont dérivés de `AGENTS.md` et du parcours existant, pas d'une recherche primaire.

- **Persona 1 — Équipe.** Joueurs de football à Godomey et alentours, smartphone Android d'entrée de gamme, forfait data limité, connexion instable, WhatsApp omniprésent, paiement Mobile Money. Objectif : savoir si un créneau est libre et le réserver sans appeler.
- **Persona 2 — Gérant.** Gère le planning et les réservations manuelles. Objectif : voir les créneaux pris, éviter les doubles réservations, disposer d'un espace admin protégé (phase 1b). La landing publique ne doit pas exposer cet espace.

**Étapes du parcours public.**

1. Arriver sur `/` et comprendre le lieu, les horaires et le prix.
2. Appuyer sur `Voir les créneaux` et arriver sur `/reserver`.
3. Choisir un jour, puis un créneau d'une heure.
4. Ouvrir la feuille, saisir le nom de l'équipe et un téléphone béninois.
5. Bloquer le créneau 15 minutes, payer le montant intégral avant confirmation ; WhatsApp reste disponible en repli.
6. Revenir sur `/reservation/[id]` pour retrouver la confirmation et les actions WhatsApp/calendrier.

### 9.3 Ideal state

- **Landing.** Une page `/` autonome, narrative, avec un seul CTA `Voir les créneaux`, les trois étapes, les tarifs exacts et les liens légaux. Elle ne répète pas les témoignages ou les preuves qu'on n'a pas.
- **Réservation.** Le parcours actuel reste intact fonctionnellement, mais déménage à `/reserver`, avec un header partagé, un skip link, un état sélectionné vert, une feuille accessible et un compte à rebours sobre.
- **Légal.** Trois pages de contenu plus un index, accessibles depuis un footer commun, avec des champs `À compléter` explicites au lieu de mentions inventées.
- **Système.** Les tokens sémantiques remplacent progressivement les hex en dur ; les composants sont nommés et réutilisés ; les états sont définis ; la dette est visible et non maquillée.

### 9.4 Before evidence

- `/home/niceboy/Elitesport/.playwright-mcp/before-home-390.png` : capture mobile 390 px.
- `/home/niceboy/Elitesport/.playwright-mcp/before-home-1440.png` : capture desktop 1440 px.
- `/home/niceboy/Elitesport/.playwright-mcp/page-2026-11-18T14-36-23-383Z.yml` : snapshot DOM de la page racine.
- Les captures n'ont pas été inspectées visuellement dans cette passe ; les constats ci-dessous viennent du snapshot DOM et des sources.

### 9.5 Gap ledger

| ID | Évidence avant | Écart | État idéal | Statut |
|---|---|---|---|---|
| G-01 | `app/page.tsx` rend directement `BookingExperience` à `/` | Aucune landing publique ; l'offre, le lieu et le déroulé ne sont pas expliqués avant le choix du créneau | `/` = landing narrative avec `Voir les créneaux` | Ouvert |
| G-02 | `app/page.tsx` est le parcours de réservation | `/reserver` n'existe pas | Déplacer le parcours à `/reserver`, conserver `/reservation/[id]` | Ouvert |
| G-03 | Aucun fichier `app/legals/**` ; aucun `LegalFooter` | Pas de mentions légales, confidentialité, CGU ni footer commun | Index `/legals` + trois pages + footer | Ouvert |
| G-04 | Header dupliqué dans `app/page.tsx`, `app/reservation/[id]/page.tsx`, `app/admin/login/page.tsx`, `app/admin/(protected)/page.tsx` | Incohérences de structure et de focus | `PageHeader` partagé + `SkipLink` | Ouvert |
| G-05 | `app/globals.css` ne définit que 4 tokens ; hex en dur `#9e3602`, `#b84304`, `#17482c`, `#c94705`, `#b23d03`, `#cf4c07`, `#24382c` | Dérive de couleurs et rôles implicites | Tokens sémantiques de la section 2 | Ouvert |
| G-06 | `SlotCard` sélectionné par contour orange sur carte verte | Contraste et signal d'état faibles ; l'orange devient une couleur d'état | Remplissage `pitch` + texte chalk + coche | Ouvert |
| G-07 | `BookingExperience.tsx` : feuille fixe sans gestion explicite du focus/Escape | Navigation clavier et retour de focus incertains | `BottomSheet` avec focus, Escape, retour au déclencheur | Ouvert |
| G-08 | Compte à rebours existant potentiellement annoncé trop souvent | Bruit pour lecteur d'écran | Annonce à la minute + message d'expiration | Ouvert |
| G-09 | `app/layout.tsx` et headers sans skip link | Utilisateur clavier obligé de traverser le header | `SkipLink` en premier élément focusable | Ouvert |
| G-10 | Bandeau tarifs à 12 px dans le parcours existant | Prix difficile à lire sur petit écran | `PriceStrip` à 14 px minimum, chiffres tabulaires | Ouvert |
| G-11 | `PWAInstallButton.tsx` : blanc sur orange = 3.58:1 | Petit texte sous le seuil AA | Texte `on-line` ou fond `line-strong` | Ouvert |
| G-12 | `app/page.tsx` commence par la roue des jours | Le processus de réservation n'est pas expliqué avant l'action | `BookingSteps` sur la landing + intro courte sur `/reserver` | Ouvert |
| G-13 | Métadonnées du root orientées réservation | `/` ne décrit pas la landing | Titre/description propres à la landing | Ouvert |
| G-14 | `app/globals.css` uniquement clair | Pas de rôles sombres branchés | Tokens sombres documentés, implémentation future | Ouvert, accepté |
| G-15 | Aucune donnée légale fournie | Mentions légales et CGU ne peuvent pas être finalisées | Champs `À compléter` + validation gérant/juriste | Ouvert, bloquant avant production |
| G-16 | Anneau de focus orange existant sur `pitch` = 2.18:1 | Focus peu visible sur le vert | Anneau chalk/blanc + offset dans le nouveau travail | Ouvert, accepté |

---

**Validation de livraison.** Le document est complet en sections 1–9. Les règles métier (créneaux d'une heure, 24h/24, fuseau `+01:00`, blocage 15 minutes, prix, paiement intégral de 25 000 FCFA avant confirmation, téléphones béninois, contrainte `bookings_no_overlap`) sont reprises sans être contournées. Aucun fichier source, de configuration ou de paquet n'a été modifié pour produire ce document.
