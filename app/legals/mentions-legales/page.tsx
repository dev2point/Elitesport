import type { Metadata } from 'next';
import { LegalPageShell } from '@/src/components/LegalPageShell';
import { LegalSection } from '@/src/components/LegalSection';
import { PlaceholderField } from '@/src/components/PlaceholderField';
import type { LegalTocItem } from '@/src/components/LegalToc';
import {
  DEPOSIT_PERCENTAGE,
  formatFcfa,
  HOURLY_RATE_FCFA,
} from '@/src/lib/pricing';

export const metadata: Metadata = {
  title: 'Mentions légales — Élite Sport Godomey',
};

const toc: LegalTocItem[] = [
  { id: 'editeur', label: 'Éditeur' },
  { id: 'hebergement', label: 'Hébergement' },
  { id: 'service', label: 'Service proposé' },
  { id: 'responsabilite', label: 'Responsabilité' },
  { id: 'contact', label: 'Contact' },
];

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell
      title="Mentions légales"
      intro="Informations relatives à l’éditeur, à l’hébergement et au service de réservation Élite Sport Godomey."
      items={toc}
    >
      <LegalSection id="editeur" title="Éditeur">
        <p>
          <PlaceholderField field="nom et forme juridique de l’éditeur" />
        </p>
        <p>
          <PlaceholderField field="adresse postale complète" />
        </p>
        <p>
          <PlaceholderField field="numéro d’immatriculation" />
        </p>
      </LegalSection>

      <LegalSection id="hebergement" title="Hébergement">
        <p>
          <PlaceholderField field="nom et adresse de l’hébergeur" />
        </p>
      </LegalSection>

      <LegalSection id="service" title="Service proposé">
        <p>
          Le service permet de consulter les créneaux d’un terrain de football
          synthétique situé à Godomey, Cotonou, Bénin, ouvert 24h/24. Les
          créneaux durent une heure. Le tarif unique est de{' '}
          {formatFcfa(HOURLY_RATE_FCFA)} par heure, jour et nuit. L’acompte est
          de {DEPOSIT_PERCENTAGE} %.
        </p>
        <p>
          Une réservation est bloquée 15 minutes puis confirmée sur WhatsApp.
        </p>
      </LegalSection>

      <LegalSection id="responsabilite" title="Responsabilité">
        <p>
          <PlaceholderField field="conditions de responsabilité" />
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          <PlaceholderField field="téléphone et adresse e-mail du gérant" />
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
