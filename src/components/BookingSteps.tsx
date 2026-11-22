'use client';

import { motion } from 'motion/react';
import { DEPOSIT_PERCENTAGE, PENDING_HOLD_MINUTES } from '@/src/lib/pricing';

const steps = [
  {
    title: 'Sélectionnez le jour et l’heure',
    detail:
      'Parcourez les 7 prochains jours et repérez en un coup d’œil les créneaux disponibles de 00h à 23h.',
  },
  {
    title: `Bloquez votre heure ${PENDING_HOLD_MINUTES} minutes`,
    detail:
      'Saisissez le nom de votre équipe et votre téléphone béninois. Le terrain est aussitôt réservé pour vous.',
  },
  {
    title: `Confirmez par acompte de ${DEPOSIT_PERCENTAGE} %`,
    detail:
      'Ouvrez le message WhatsApp prérempli avec votre référence et réglez l’acompte par Mobile Money.',
  },
];

export function BookingSteps() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="booking-steps-title"
      className="border-t border-border-subtle bg-white py-14 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-3.5 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-line-strong">
            Parcours en 3 étapes
          </p>
          <h2
            id="booking-steps-title"
            className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl"
          >
            Comment réserver en moins d’une minute
          </h2>
        </motion.div>

        <ol className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.38,
                delay: index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-2xl border border-border-subtle bg-canvas p-5 sm:p-6 flex flex-col gap-2.5"
            >
              <span
                aria-hidden="true"
                className="font-display text-3xl font-bold text-line-strong leading-none tabular-nums"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-xl font-bold text-ink leading-snug">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-text-secondary">
                {step.detail}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
