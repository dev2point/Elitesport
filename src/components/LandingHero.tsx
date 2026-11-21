export function LandingHero() {
  return (
    <section className="mx-auto max-w-5xl px-3.5 py-16 sm:px-4 md:py-24">
      <div className="md:grid md:grid-cols-2 md:items-center md:gap-12">
        <div className="flex flex-col items-start">
          <h1 className="font-display text-[2.5rem] font-bold leading-[0.95] tracking-[-0.01em] text-ink md:text-[3.5rem]">
            Le terrain de Godomey, ouvert 24h/24.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
            {
              "Élite Sport Godomey — Godomey, Cotonou, Bénin. Un créneau d'une heure, réservé depuis votre téléphone."
            }
          </p>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-tertiary">
            <span>24h/24</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span>Créneau d&apos;une heure</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span>Godomey</span>
          </p>

          <a
            href="/reserver"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-pitch px-6 text-base font-semibold text-canvas transition-colors hover:bg-pitch-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
          >
            Voir les créneaux
          </a>
        </div>

        <svg
          viewBox="0 0 600 220"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className="mt-12 h-28 w-full text-line md:mt-0 md:h-56"
        >
          <g
            className="pitch-line"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
          >
            <rect x="1.5" y="1.5" width="597" height="217" />
            <path d="M300 1.5V218.5" />
          </g>
          <g
            className="pitch-line pitch-line--2"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
          >
            <circle cx="300" cy="110" r="42" />
            <rect x="1.5" y="50" width="64" height="120" />
            <rect x="534.5" y="50" width="64" height="120" />
          </g>
        </svg>
      </div>
    </section>
  );
}
