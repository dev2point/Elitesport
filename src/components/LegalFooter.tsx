import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

const legalLinks = [
  { href: '/legals', label: 'Informations légales' },
  { href: '/legals/mentions-legales', label: 'Mentions légales' },
  { href: '/legals/confidentialite', label: 'Confidentialité' },
  { href: '/legals/cgu', label: 'CGU' },
] as const;

export function LegalFooter() {
  return (
    <footer className="border-t border-border-subtle bg-canvas">
      <div className="mx-auto max-w-5xl px-3.5 py-10 sm:px-4 sm:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="space-y-2.5">
            <p className="font-display text-xl font-bold text-ink">
              Élite Sport Godomey
            </p>
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <MapPin className="h-4 w-4 shrink-0 text-line-strong" aria-hidden="true" />
              <span>Godomey, Cotonou, Bénin</span>
            </p>
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock className="h-4 w-4 shrink-0 text-pitch" aria-hidden="true" />
              <span>Terrain synthétique ouvert 24h/24 · 7j/7</span>
            </p>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <nav aria-label="Liens rapides et informations légales">
              <ul className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
                <li>
                  <Link
                    href="/reserver"
                    className="inline-flex min-h-[44px] items-center text-sm font-semibold text-pitch underline underline-offset-4 hover:text-pitch-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    Réserver un créneau
                  </Link>
                </li>
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-[44px] items-center text-sm text-text-secondary underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/admin"
                    className="inline-flex min-h-[44px] items-center text-sm text-text-tertiary underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    Espace gérant
                  </Link>
                </li>
              </ul>
            </nav>

            <PWAInstallButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
