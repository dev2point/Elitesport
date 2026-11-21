import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LegalFooter } from './LegalFooter';
import { LegalToc, type LegalTocItem } from './LegalToc';
import { PWAInstallButton } from './PWAInstallButton';
import { PlaceholderField } from './PlaceholderField';
import { SkipLink } from './SkipLink';

interface LegalPageShellProps {
  title: string;
  intro: string;
  items: readonly LegalTocItem[];
  children: ReactNode;
}

export function LegalPageShell({
  title,
  intro,
  items,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SkipLink />

      <div className="h-1 w-full bg-line" aria-hidden="true" />

      <header className="border-b border-border-subtle bg-canvas">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3.5 py-3.5 sm:px-4">
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-sm font-display text-xl font-bold leading-none text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Élite Sport Godomey
            </Link>
            <p className="mt-1 text-sm text-text-secondary">
              Godomey, Cotonou, Bénin
            </p>
          </div>
          <PWAInstallButton />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-2xl px-3.5 py-10 sm:px-4 sm:py-14">
        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              {title}
            </h1>
            <p className="text-base leading-relaxed text-text-secondary">{intro}</p>
            <p className="text-sm text-text-tertiary">
              <PlaceholderField field="date de dernière mise à jour" />
            </p>
          </div>

          {items.length > 0 && (
            <div className="rounded-xl border border-border-subtle bg-surface-card p-4 sm:p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">
                Sommaire
              </h2>
              <LegalToc items={items} />
            </div>
          )}

          <div className="space-y-10">{children}</div>

          <p className="border-t border-border-subtle pt-6">
            <Link
              href="/reserver"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-line-strong underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              Retour aux créneaux
            </Link>
          </p>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
