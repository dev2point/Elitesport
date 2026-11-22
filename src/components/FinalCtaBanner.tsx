'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import heroTwilightImg from '@/src/assets/images/hero_pitch_twilight_1795268192805.jpg';

export function FinalCtaBanner() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="mx-auto max-w-5xl px-3.5 py-12 sm:px-4 sm:py-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl bg-[#16231b] text-[#f8f7f2] border border-[#16231b]"
      >
        <Image
          src={heroTwilightImg}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          referrerPolicy="no-referrer"
          className="object-cover opacity-35"
          aria-hidden="true"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#16231b]/95 via-[#16231b]/85 to-[#1f5d3a]/70"
        />

        <div
          aria-hidden="true"
          className="relative h-1 w-full bg-[#e8590c]"
        />

        <div className="relative px-5 py-10 sm:px-10 sm:py-14 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2
              id="final-cta-heading"
              className="font-display text-3xl sm:text-4xl font-bold leading-[1.12] tracking-[-0.02em] text-white"
            >
              Votre prochain match à Godomey commence maintenant.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#f8f7f2]/85 leading-relaxed">
              Choisissez un créneau libre aujourd’hui ou dans les 7 prochains
              jours et recevez votre fiche de réservation prête pour WhatsApp.
            </p>
          </div>

          <Link
            href="/reserver"
            className="min-h-[52px] px-6 py-3 rounded-xl bg-[#c94705] hover:bg-[#b23d03] text-white font-display text-xl font-bold tracking-wide inline-flex items-center justify-center gap-2 shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span>Voir les 24 créneaux</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
