'use client';

import { useEffect, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import heroTwilightImg from '@/src/assets/images/hero_pitch_twilight_1795268192805.jpg';
import heroNightMatchImg from '@/src/assets/images/hero_soccer_night_1795268211358.jpg';
import heroTurfDetailImg from '@/src/assets/images/hero_turf_detail_1795268193867.jpg';
import {
  DEPOSIT_PERCENTAGE,
  HOURLY_RATE_FCFA,
  PENDING_HOLD_MINUTES,
  formatFcfa,
} from '@/src/lib/pricing';

interface HeroScene {
  id: string;
  tabLabel: string;
  captionTitle: string;
  captionSubtitle: string;
  image: StaticImageData;
  alt: string;
}

const HERO_SCENES: readonly HeroScene[] = [
  {
    id: 'twilight',
    tabLabel: 'Vue LED',
    captionTitle: 'Éclairage LED intégral 24h/24',
    captionSubtitle: 'Godomey · Terrain synthétique clôturé',
    image: heroTwilightImg,
    alt: 'Vue d’ensemble du terrain synthétique Élite Sport Godomey éclairé par projecteurs LED au crépuscule',
  },
  {
    id: 'night',
    tabLabel: 'Match nuit',
    captionTitle: 'Sessions nocturnes 18h – 05h',
    captionSubtitle: 'Visibilité nette et fraîcheur en soirée',
    image: heroNightMatchImg,
    alt: 'Joueurs en match nocturne sur le gazon synthétique vert avec lignes orange sous projecteurs',
  },
  {
    id: 'turf',
    tabLabel: 'Gazon pro',
    captionTitle: 'Surface synthétique drainante',
    captionSubtitle: 'Lignes orange nettes · Rebond régulier',
    image: heroTurfDetailImg,
    alt: 'Détail du gazon synthétique vert avec ligne orange et poteau de corner au soleil',
  },
];

interface LandingHeroProps {
  availableTodayCount: number | null;
}

export function LandingHero({ availableTodayCount }: LandingHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SCENES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const currentScene = HERO_SCENES[activeIndex];

  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-5xl px-3.5 pt-8 pb-12 sm:px-4 sm:pt-12 sm:pb-16 md:pt-16 md:pb-20"
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-10">
        {/* Copy & conversion column */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-6 flex flex-col items-start"
        >
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-semibold text-pitch">
            <MapPin className="h-4 w-4 shrink-0 text-line-strong" aria-hidden="true" />
            <span>Godomey, Cotonou</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span>Ouvert 24h/24</span>
          </p>

          <h1
            id="hero-heading"
            className="mt-3 font-display text-[2.6rem] font-bold leading-[0.94] tracking-[-0.015em] text-ink text-balance sm:text-[3.25rem] md:text-[3.75rem]"
          >
            Le terrain synthétique de Godomey, prêt à toute heure.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Consultez les 24 créneaux du jour en direct sur votre téléphone,
            bloquez votre heure pendant {PENDING_HOLD_MINUTES} minutes et
            confirmez directement sur WhatsApp.
          </p>

          {/* Primary conversion CTA row */}
          <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/reserver"
              className="group min-h-[52px] px-6 py-3 rounded-xl bg-[#c94705] hover:bg-[#b23d03] text-white font-display text-xl font-bold tracking-wide inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16231b]"
            >
              <span>Réserver un créneau</span>
              <ArrowRight
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <a
              href="#tarifs"
              className="min-h-[52px] px-5 py-3 rounded-xl border border-[#16231b]/20 bg-white hover:border-[#1f5d3a] text-[#16231b] text-base font-semibold inline-flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84304]"
            >
              Voir les tarifs
            </a>
          </div>

          {/* Real-time slot hint or key guarantee */}
          <div className="mt-5 pt-4 w-full border-t border-border-subtle flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-secondary tabular-nums">
            {typeof availableTodayCount === 'number' && (
              <>
                <span className="inline-flex items-center gap-1.5 font-bold text-pitch">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {availableTodayCount > 0
                    ? `${availableTodayCount} créneau${availableTodayCount > 1 ? 'x' : ''} libre${availableTodayCount > 1 ? 's' : ''} aujourd’hui`
                    : 'Prochains créneaux dès demain'}
                </span>
                <span aria-hidden="true" className="text-border-strong">
                  ·
                </span>
              </>
            )}
            <span>{formatFcfa(HOURLY_RATE_FCFA)} / heure</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span>Acompte {DEPOSIT_PERCENTAGE} %</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span>Sans inscription</span>
          </div>
        </motion.div>

        {/* Dynamic Interactive Media Stage */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-6"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#16231b]/15 bg-[#16231b] shadow-lg">
            <div className="relative aspect-[4/3] w-full bg-[#16231b]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScene.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentScene.image}
                    alt={currentScene.alt}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Legibility scrim */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#16231b]/90 via-[#16231b]/45 to-transparent"
              />

              {/* Pitch orange architectural corner line */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-[#e8590c]"
              />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-[#f8f7f2]">
                <p className="font-display text-xl sm:text-2xl font-bold leading-tight">
                  {currentScene.captionTitle}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm text-[#f8f7f2]/85">
                  {currentScene.captionSubtitle}
                </p>
              </div>
            </div>

            {/* Interactive scene selector tabs */}
            <div
              role="tablist"
              aria-label="Vues du terrain"
              className="grid grid-cols-3 border-t border-white/10 bg-[#16231b]"
            >
              {HERO_SCENES.map((scene, index) => {
                const isSelected = index === activeIndex;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setAutoPlay(false);
                      setActiveIndex(index);
                    }}
                    className={`relative min-h-[46px] px-2 py-2.5 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#e8590c] cursor-pointer ${
                      isSelected
                        ? 'text-white bg-white/10'
                        : 'text-[#f8f7f2]/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{scene.tabLabel}</span>
                    {isSelected && (
                      <motion.span
                        layoutId="hero-scene-indicator"
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-x-3 bottom-0 h-0.5 bg-[#e8590c]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
