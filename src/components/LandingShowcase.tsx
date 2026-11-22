'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, MessageCircle, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import heroNightMatchImg from '@/src/assets/images/hero_soccer_night_1795268211358.jpg';
import heroTurfDetailImg from '@/src/assets/images/hero_turf_detail_1795268193867.jpg';
import { PENDING_HOLD_MINUTES } from '@/src/lib/pricing';

const CAPABILITIES = [
  {
    number: '01',
    icon: ShieldCheck,
    title: 'Double réservation impossible',
    description:
      'Chaque créneau validé ou bloqué est verrouillé côté serveur pour éviter tout conflit entre équipes.',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Réservation sans compte',
    description:
      'Indiquez uniquement le nom de votre équipe et votre numéro béninois pour bloquer votre heure.',
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Confirmation WhatsApp directe',
    description: `Votre créneau reste bloqué ${PENDING_HOLD_MINUTES} minutes le temps d’envoyer l’acompte par Mobile Money.`,
  },
  {
    number: '04',
    icon: Smartphone,
    title: 'Léger sur Android',
    description:
      'Pensé pour les écrans de 360 px, les connexions mobiles lentes et installable sur l’écran d’accueil.',
  },
] as const;

export function LandingShowcase() {
  return (
    <section
      id="terrain"
      aria-labelledby="showcase-heading"
      className="border-t border-border-subtle bg-surface-muted/65 py-14 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-3.5 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-line-strong">
            Le terrain · Équipements & fiabilité
          </p>
          <h2
            id="showcase-heading"
            className="mt-2 font-display text-3xl font-bold leading-[0.98] text-ink sm:text-4xl"
          >
            Conçu pour jouer sans contretemps, de l’après-midi jusqu’à l’aube.
          </h2>
        </motion.div>

        {/* Secondary Dynamic Hero Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          {/* Dark Stadium Night Feature Hero */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 overflow-hidden rounded-2xl bg-[#16231b] text-[#f8f7f2] border border-[#16231b]/15 flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-[#1f5d3a]/40 overflow-hidden">
              <Image
                src={heroNightMatchImg}
                alt="Match de football en soirée sous projecteurs LED à Élite Sport Godomey"
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                referrerPolicy="no-referrer"
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#16231b] via-[#16231b]/20 to-transparent"
              />
            </div>

            <div className="p-5 sm:p-6">
              <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white">
                Éclairage nocturne sans zone d’ombre
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#f8f7f2]/85">
                Organisez vos tournois amicaux et séances entre collègues après
                le travail. Les projecteurs LED couvrent l’ensemble du rectangle
                jusqu’à 05h du matin.
              </p>
              <Link
                href="/reserver"
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#c94705] hover:bg-[#b23d03] px-4 py-2.5 text-sm font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Réserver une session soir</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.article>

          {/* Turf & Drainage Feature Hero */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 overflow-hidden rounded-2xl bg-white text-ink border border-border-subtle flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] w-full bg-[#1f5d3a]/15 overflow-hidden">
              <Image
                src={heroTurfDetailImg}
                alt="Gazon synthétique vert haute densité avec marquage orange net"
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                referrerPolicy="no-referrer"
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>

            <div className="p-5 sm:p-6">
              <h3 className="font-display text-2xl font-bold leading-tight text-ink">
                Gazon synthétique drainant & lignes orange
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-text-secondary">
                Surface régulière, appuis sûrs même après la pluie et filets
                périphériques hauts pour garder le ballon en jeu toute l’heure.
              </p>
              <a
                href="#tarifs"
                className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-pitch underline underline-offset-4 hover:text-pitch-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <span>Consulter le tarif horaire</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </motion.article>
        </div>

        {/* 4 numbered operational guarantees */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-xl border border-border-subtle bg-white p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xl font-bold text-line-strong tabular-nums">
                      {item.number}
                    </span>
                    <Icon className="h-5 w-5 text-pitch shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold text-ink leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
