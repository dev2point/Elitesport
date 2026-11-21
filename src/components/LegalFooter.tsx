import Link from 'next/link';

const legalLinks = [
  { href: '/legals', label: 'Informations légales' },
  { href: '/legals/mentions-legales', label: 'Mentions légales' },
  { href: '/legals/confidentialite', label: 'Confidentialité' },
  { href: '/legals/cgu', label: 'CGU' },
] as const;

export function LegalFooter() {
  return (
    <footer className="border-t border-border-subtle bg-canvas">
      <div className="mx-auto max-w-5xl px-3.5 py-8 sm:px-4 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
          <div>
            <p className="font-display text-lg font-bold text-ink">
              Élite Sport Godomey
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Godomey, Cotonou, Bénin
            </p>
          </div>

          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-sm text-text-secondary underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
