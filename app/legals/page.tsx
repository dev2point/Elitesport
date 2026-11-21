import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell } from '@/src/components/LegalPageShell';
import { LegalSection } from '@/src/components/LegalSection';
import type { LegalTocItem } from '@/src/components/LegalToc';

export const metadata: Metadata = {
  title: 'Informations légales — Élite Sport Godomey',
};

const toc: LegalTocItem[] = [
  { id: 'mentions-legales', label: 'Mentions légales' },
  { id: 'confidentialite', label: 'Politique de confidentialité' },
  { id: 'cgu', label: 'Conditions générales de vente' },
];

export default function LegalsPage() {
  return (
    <LegalPageShell
      title="Informations légales"
      intro="Retrouvez les informations obligatoires relatives au service de réservation Élite Sport Godomey. Les éléments non encore fournis sont signalés explicitement."
      items={toc}
    >
      <LegalSection id="mentions-legales" title="Mentions légales">
        <p>
          Éditeur, hébergeur et contacts : les informations définitives sont en
          cours de collecte. Consultez la page dédiée pour connaître les champs
          restant à renseigner.
        </p>
        <Link
          href="/legals/mentions-legales"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-line-strong underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Lire les mentions légales
        </Link>
      </LegalSection>

      <LegalSection id="confidentialite" title="Politique de confidentialité">
        <p>
          Le service utilise le nom de l’équipe, le téléphone et le créneau
          choisi pour bloquer une réservation et permettre sa confirmation sur
          WhatsApp. Les durées de conservation et les contacts sont à compléter.
        </p>
        <Link
          href="/legals/confidentialite"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-line-strong underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Lire la politique de confidentialité
        </Link>
      </LegalSection>

      <LegalSection id="cgu" title="Conditions générales de vente">
        <p>
          Les créneaux durent une heure, le terrain est ouvert 24h/24 à Godomey,
          Cotonou, Bénin, et l’acompte est de 30 %. Les règles d’annulation et de
          remboursement sont à compléter.
        </p>
        <Link
          href="/legals/cgu"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-line-strong underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Lire les conditions générales de vente
        </Link>
      </LegalSection>
    </LegalPageShell>
  );
}
