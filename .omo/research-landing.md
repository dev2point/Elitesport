# Design Research Report: Élite Sport Godomey Landing Page
"Terrain & lignes" — chalk background, animated pitch lines, Barlow Condensed headings, green CTA, restrained motion, no invented photos

## Shipped Examples

**Kickmere**: Barlow Condensed wordmark, "Chalk and Turf green" CTA (chalk on orange marked not for text). Asymmetric hero: flush-left headline, CTA pill below data strip. Green CTA only on neutral surfaces — restraint rule for Godomey.

**PlayFootball.net**: Viewport‑filled hero with booking calendar, primary CTA "Book A Pitch." Stacks headline, sub‑headline, CTA vertically on mobile; reflows horizontal on desktop. Mobile stacking places CTA at viewport bottom after first scroll. Minimal proof — just calendar + availability, matching "no invented photos."

**SPADA Arenas**: Pan‑Africa venue network with 1‑tap WhatsApp booking. Vertical hero card stack on mobile with persistent WhatsApp CTA at bottom. Only real venue‑exterior imagery — no invented photos.

## Synthesis

**Primary action**: Reserve a pitch — date → time slot → 15‑minute hold → WhatsApp confirmation.

**Section order (mobile‑first)**: 1. Hero: chalk background, Barlow Condensed "Réservez votre terrain", green CTA "Réserver", 24/7 badge. 2. Slot grid: 24 hourly cells, green=available, amber=held (15 min pending), red=unavailable; touch targets ≥44 px. 3. Offer/proof: anti‑double‑booking constraint + WhatsApp confirmation, "15 min blocage avant confirmation". 4. Footer: WhatsApp contact, terrain rules summary, French copy only.

**What to leave out**: No testimonials, no photo gallery, no device mockups, no gradient backgrounds; no multi‑column on mobile; no animated counter, no confetti, no sound; no pricing tables (centralized in `src/lib/pricing.ts`); no newsletter signup, no social proof cards.

**Motion rules (restrained)**: Hero line‑draw: CSS `stroke-dashoffset` path, one‑play reveal, no loop. Slot‑grid row reveal: Intersection Observer fade‑in (200 ms), stagger 80 ms, disabled under `prefers-reduced-motion`. CTA state change: hover→pressed→focus‑visible, no continuous animation. Animated properties: `transform` and `opacity` only; no `top`/`left`/`width` transitions. Motion budget: ≤2 animated elements visible simultaneously; all others static.

**Anti‑slop checklist**: No coloured bar on one side of any card/rounded panel. No accent outline on rounded card. No promotional copy: "seamlessly", "effortlessly", "smart", "powerful" — only plain facts. No stat tile, no repeated formula. No decorative badge without changing status. No zero‑offset coloured glow. No emoji as icons; Lucide SVG only. No hard‑coded vanity numbers. Contrast: text 4.5:1 (large 3:1) in both themes; CTA edges 3:1. Focus ring visible at 360 px; never covered by sticky bar. Target size: ≥24 × 24 CSS px; slot cells grow hit area with padding, not glyph expansion. No `any` type, no `localStorage` for métier data, no `prepare: true` on Postgres. French copy only; all labels/errors/messages in French. Build passes.

**Report path**: `/home/niceboy/Elitesport/.omo/research-landing.md`
**5‑line summary**: Three shipped examples (Kickmere, PlayFootball, SPADA) provide layout grammar: Barlow Condensed hero, green CTA hierarchy, mobile‑first slot stacking with restrained motion. Primary action = pitch reservation with 15‑min pending block. Sections: hero → availability grid → anti‑double‑booking proof → footer. Anti‑slop: no testimonials, no invented photos, single‑column mobile, focus‑visible rings, ≥24 px targets, French copy only.
