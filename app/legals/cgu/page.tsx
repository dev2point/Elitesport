import type { Metadata } from 'next';
import { LegalPageShell } from '@/src/components/LegalPageShell';
import { LegalSection } from '@/src/components/LegalSection';
import { PlaceholderField } from '@/src/components/PlaceholderField';
import type { LegalTocItem } from '@/src/components/LegalToc';
import { formatFcfa, HOURLY_RATE_FCFA } from '@/src/lib/pricing';

export const metadata: Metadata = {
  title: 'Conditions générales de vente — Élite Sport Godomey',
};

const toc: LegalTocItem[] = [
  { id: 'objet', label: 'Objet' },
  { id: 'reservation', label: 'Réservation' },
  { id: 'tarifs', label: 'Tarifs et paiement intégral' },
  { id: 'annulation', label: 'Annulation et remboursement' },
  { id: 'modification', label: 'Modification' },
];

export default function CguPage() {
  return (
    <LegalPageShell
      title="Conditions générales de vente"
      intro="Règles d’utilisation du service de réservation Élite Sport Godomey."
      items={toc}
    >
      <LegalSection id="objet" title="Objet">
        <p>
          Les présentes conditions régissent la réservation en ligne d’un
          créneau sur le terrain de football synthétique Élite Sport Godomey,
          à Godomey, Cotonou, Bénin.
        </p>
      </LegalSection>

      <LegalSection id="reservation" title="Réservation">
        <p>
          Le terrain est ouvert 24h/24. Les créneaux durent une heure et sont
          proposés sur les sept jours à venir. Le choix d’un créneau bloque la
          réservation pendant 15 minutes avant sa confirmation par paiement intégral.
        </p>
      </LegalSection>

      <LegalSection id="tarifs" title="Tarifs et paiement intégral">
        <p>
          Le tarif unique est de {formatFcfa(HOURLY_RATE_FCFA)} par heure, 24h/24.
          Le créneau est confirmé uniquement après réception du paiement intégral.
        </p>
        <p>
          <PlaceholderField field="modalités de paiement intégral" />
        </p>
      </LegalSection>

      <LegalSection id="annulation" title="Annulation et remboursement">
        <p>
          <PlaceholderField field="délai d’annulation et conditions de remboursement" />
        </p>
      </LegalSection>

      <LegalSection id="modification" title="Modification">
        <p>
          <PlaceholderField field="conditions de modification d’une réservation" />
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
