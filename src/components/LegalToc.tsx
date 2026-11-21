import Link from 'next/link';

export interface LegalTocItem {
  id: string;
  label: string;
}

interface LegalTocProps {
  items: readonly LegalTocItem[];
  currentId?: string;
}

export function LegalToc({ items, currentId }: LegalTocProps) {
  return (
    <nav aria-label="Sommaire">
      <ul className="space-y-2">
        {items.map((item) => {
          const isCurrent = item.id === currentId;

          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                aria-current={isCurrent ? 'location' : undefined}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                  isCurrent
                    ? 'font-semibold text-line-strong'
                    : 'text-text-secondary hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
