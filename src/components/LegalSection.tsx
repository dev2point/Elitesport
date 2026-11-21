import type { ReactNode } from 'react';

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8">
      <h2
        id={`${id}-title`}
        className="font-display text-2xl font-semibold leading-tight text-ink"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );
}
