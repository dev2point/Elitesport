'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import {
  HOURLY_RATE_FCFA,
  PENDING_HOLD_MINUTES,
  formatFcfa,
} from '@/src/lib/pricing';

const TARIFF_TIERS = [
  {
    id: 'day',
    title: 'Sessions Journée',
    hours: '06h00 – 17h59',
    icon: Sun,
    rate: HOURLY_RATE_FCFA,
    description:
      'Idéal pour les entraînements matinaux, les matchs entre amis en journée et les fins d’après-midi.',
    featured: false,
  },
  {
    id: 'night',
    title: 'Sessions Nuit & Projecteurs',
    hours: '18h00 – 05h59',
    icon: Moon,
    rate: HOURLY_RATE_FCFA,
    description:
      'Éclairage LED complet inclus sans majoration de prix pour jouer au frais après le travail ou tard dans la nuit.',
    featured: true,
  },
] as const;

export function PriceStrip() {
  return (
    <section
      id="tarifs"
      aria-labelledby="price-strip-title"
      className="border-t border-border-subtle bg-canvas py-14 sm:py-20 scroll-mt-16"
    >
      <div className="mx-auto max-w-5xl px-3.5 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-line-strong">
              Tarif unique transparent
            </p>
            <h2
              id="price-strip-title"
              className="mt-2 font-display text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:text-4xl"
            >
              {formatFcfa(HOURLY_RATE_FCFA)} par heure, jour et nuit.
            </h2>
          </div>
          <p className="text-sm text-text-secondary tabular-nums">
            Paiement intégral de {formatFcfa(HOURLY_RATE_FCFA)} avant confirmation ·
            Blocage {PENDING_HOLD_MINUTES} min
          </p>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {TARIFF_TIERS.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <motion.article
                key={tier.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.38,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`rounded-2xl p-6 flex flex-col justify-between ${
                  tier.featured
                    ? 'bg-[#1f5d3a] text-[#f8f7f2] border border-[#1f5d3a] shadow-md'
                    : 'bg-white text-ink border border-border-subtle'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        tier.featured ? 'text-[#f8f7f2]/85' : 'text-text-secondary'
                      }`}
                    >
                      {tier.hours}
                    </span>
                    <Icon
                      className={`h-5 w-5 shrink-0 ${
                        tier.featured ? 'text-[#e8590c]' : 'text-line-strong'
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-3 font-display text-2xl font-bold leading-tight">
                    {tier.title}
                  </h3>

                  <p className="mt-3 font-display text-4xl font-bold leading-none tabular-nums">
                    {formatFcfa(tier.rate)}
                    <span
                      className={`ml-1.5 font-sans text-sm font-medium ${
                        tier.featured ? 'text-[#f8f7f2]/80' : 'text-text-secondary'
                      }`}
                    >
                      / 1 heure
                    </span>
                  </p>

                  <p
                    className={`mt-3 text-sm leading-relaxed ${
                      tier.featured ? 'text-[#f8f7f2]/85' : 'text-text-secondary'
                    }`}
                  >
                    {tier.description}
                  </p>

                </div>

                <Link
                  href="/reserver"
                  className={`mt-6 min-h-[48px] px-5 py-3 rounded-xl font-display text-lg font-bold tracking-wide inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.featured
                      ? 'bg-[#c94705] hover:bg-[#b23d03] text-white focus-visible:outline-white'
                      : 'bg-ink hover:bg-pitch text-canvas focus-visible:outline-focus-ring'
                  }`}
                >
                  <span>Choisir un créneau</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
