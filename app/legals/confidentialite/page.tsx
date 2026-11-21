import type { Metadata } from 'next';
import { LegalPageShell } from '@/src/components/LegalPageShell';
import { LegalSection } from '@/src/components/LegalSection';
import { PlaceholderField } from '@/src/components/PlaceholderField';
import type { LegalTocItem } from '@/src/components/LegalToc';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Élite Sport Godomey',
};

const toc: LegalTocItem[] = [
  { id: 'responsable', label: 'Responsable du traitement' },
  { id: 'donnees', label: 'Données collectées' },
  { id: 'finalites', label: 'Finalités' },
  { id: 'conservation', label: 'Conservation' },
  { id: 'droits', label: 'Droits et contact' },
];

export default function ConfidentialitePage() {
  return (
    <LegalPageShell
      title="Politique de confidentialité"
      intro="Comment Élite Sport Godomey traite les informations transmises lors d’une réservation."
      items={toc}
    >
      <LegalSection id="responsable" title="Responsable du traitement">
        <p>
          <PlaceholderField field="identité et coordonnées du responsable de traitement" />
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="Données collectées">
        <p>
          Pour réserver, vous transmettez le nom de votre équipe et un numéro de
          téléphone béninois. La date, le créneau choisi et le statut de la
          réservation sont associés à votre demande. Aucun compte n’est demandé
          aux équipes.
        </p>
      </LegalSection>

      <LegalSection id="finalites" title="Finalités">
        <p>
          Ces données servent à bloquer le créneau pendant 15 minutes, à
          permettre la confirmation sur WhatsApp et à gérer le planning du
          terrain.
        </p>
      </LegalSection>

      <LegalSection id="conservation" title="Conservation">
        <p>
          <PlaceholderField field="durée de conservation des réservations" />
        </p>
      </LegalSection>

      <LegalSection id="droits" title="Droits et contact">
        <p>
          <PlaceholderField field="modalités d’exercice des droits et adresse de contact" />
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
