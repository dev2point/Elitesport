'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowUpRight, Calendar, Clock, MapPin, Search } from 'lucide-react';
import beninGoldenPitchImg from '@/src/assets/images/benin_golden_pitch_1795347414040.jpg';
import heroNightMatchImg from '@/src/assets/images/hero_soccer_night_1795268211358.jpg';
import playerAvatarOneImg from '@/src/assets/images/player_avatar_one_1795347414531.jpg';
import playerAvatarTwoImg from '@/src/assets/images/player_avatar_two_1795347414216.jpg';
import { HOURLY_RATE_FCFA, formatFcfa } from '@/src/lib/pricing';
import type { DayOption } from '@/src/lib/timezone';
import { Navbar } from './Navbar';

type FieldFormat = '5v5' | '7v7' | '11v11';

const FIELD_FORMATS: readonly FieldFormat[] = ['5v5', '7v7', '11v11'];

const TIME_SLOTS = Array.from({ length: 24 }, (_, hour) => {
  const next = (hour + 1) % 24;
  return {
    hour,
    label: `${hour.toString().padStart(2, '0')}h – ${next
      .toString()
      .padStart(2, '0')}h`,
  };
});

interface LandingHeroProps {
  days: DayOption[];
  availableTodayCount: number | null;
}

export function LandingHero({ days, availableTodayCount }: LandingHeroProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(
    days[0]?.dateStr ?? ''
  );
  const [selectedHour, setSelectedHour] = useState<number>(18);
  const [selectedFormat, setSelectedFormat] = useState<FieldFormat>('7v7');
  const [pitchImgError, setPitchImgError] = useState(false);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedDate) {
      params.set('date', selectedDate);
    }
    params.set('hour', String(selectedHour));
    params.set('format', selectedFormat);
    router.push(`/reserver?${params.toString()}`);
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="w-full"
    >
      {/* Full-Bleed Edge-to-Edge Atmospheric Pitch Canvas */}
      <div className="group/hero relative w-full overflow-hidden bg-[#123D2B]">
        {/* Background Pitch Photography with Subtle Hover Zoom */}
        {!pitchImgError ? (
          <Image
            src={beninGoldenPitchImg}
            alt="Terrain de football synthétique moderne à Cotonou au Bénin au coucher du soleil avec joueurs et éclairage"
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            onError={() => setPitchImgError(true)}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover/hero:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#123D2B] to-[#0A2217]" />
        )}

        {/* Measured Contrast Scrims for WCAG AAA Text Legibility */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0A2116]/90 via-[#123D2B]/62 to-[#123D2B]/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A2116]/80 via-transparent to-[#0A2116]/45"
        />

        {/* Foreground Interactive Content */}
        <div className="relative z-10 mx-auto flex min-h-[600px] lg:min-h-[680px] w-full max-w-[1360px] flex-col justify-between px-4 pt-4 pb-10 sm:px-6 sm:pt-6 sm:pb-12 lg:px-10 lg:pt-8 lg:pb-14">
          {/* Top Translucent Glass Navigation Bar */}
          <Navbar variant="hero" />

          {/* Main 2-Column Composition inside Hero */}
          <div className="mt-10 sm:mt-14 lg:mt-16 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
            {/* LEFT COLUMN: Editorial Headline, Value Prop, CTAs & Avatars */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 pb-1 lg:pb-4"
            >
              {/* Eyebrow Glass Tag */}
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm font-hero text-[11px] sm:text-xs font-bold uppercase tracking-[0.07em] text-white/95">
                <span aria-hidden="true">⚽</span>
                <span>LE FOOTBALL À PORTÉE DE CLIC</span>
              </p>

              {/* Headline */}
              <h1
                id="hero-heading"
                className="mt-5 font-hero text-[2.35rem] font-extrabold leading-[1.06] tracking-[-0.025em] text-white text-balance sm:text-[3.25rem] lg:text-[3.75rem]"
              >
                Ton prochain match{' '}
                <span className="italic font-semibold text-[#32CD75]">
                  commence ici.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="mt-4 max-w-lg font-body text-sm sm:text-base leading-relaxed text-white/85">
                Trouve et réserve les meilleurs terrains de football près de
                chez toi. Choisis ton créneau, invite ton équipe et profite du
                jeu.
              </p>

              {/* CTAs + Avatars Row */}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href="/reserver"
                  className="group min-h-[48px] rounded-full bg-white hover:bg-[#F8FAF7] pl-5 pr-2 py-1.5 font-hero text-sm sm:text-base font-extrabold text-[#123D2B] inline-flex items-center gap-3 shadow-md transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32CD75] whitespace-nowrap shrink-0"
                >
                  <span>Trouver un terrain</span>
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#123D2B] text-white transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>

                <a
                  href="#comment-ca-marche"
                  className="min-h-[48px] px-4 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/18 backdrop-blur-sm font-body text-sm font-semibold text-white inline-flex items-center justify-center transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32CD75] whitespace-nowrap shrink-0"
                >
                  Comment ça marche
                </a>
              </div>

              {/* Trust Indicator with Player Avatars */}
              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <div className="flex items-center -space-x-2.5 shrink-0">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-[#123D2B] bg-[#123D2B]">
                    <Image
                      src={playerAvatarOneImg}
                      alt="Joueur de football à Cotonou"
                      fill
                      sizes="36px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-[#123D2B] bg-[#123D2B]">
                    <Image
                      src={playerAvatarTwoImg}
                      alt="Joueuse de football après un match"
                      fill
                      sizes="36px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-[#123D2B] bg-[#123D2B]">
                    <Image
                      src={heroNightMatchImg}
                      alt="Match sur terrain synthétique au Bénin"
                      fill
                      sizes="36px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-white">
                    Rejoins les passionnés de football
                  </p>
                  <p className="text-xs text-white/75 tabular-nums">
                    Cotonou, Bénin · {formatFcfa(HOURLY_RATE_FCFA)} / 1h
                    {typeof availableTodayCount === 'number' &&
                    availableTodayCount > 0
                      ? ` · ${availableTodayCount} créneau${availableTodayCount > 1 ? 'x' : ''} libre${availableTodayCount > 1 ? 's' : ''} aujourd’hui`
                      : ''}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Two-Tone Floating Glass Booking Card (Inspired by Reference UI) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex lg:justify-end"
            >
              <form
                onSubmit={handleSearch}
                aria-label="Recherche rapide de terrain"
                className="w-full lg:max-w-[460px] overflow-hidden rounded-2xl border border-white/25 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
              >
                {/* Solid Light Header Strip (mirrors reference card top bar) */}
                <div className="bg-white px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-[#17231D]">
                    <MapPin
                      className="w-4 h-4 text-[#123D2B] shrink-0"
                      aria-hidden="true"
                    />
                    <span>Cotonou, Bénin</span>
                  </div>
                  <span className="text-xs font-bold text-[#123D2B] tabular-nums">
                    {formatFcfa(HOURLY_RATE_FCFA)} / 1h · 24h/24
                  </span>
                </div>

                {/* Frosted Dark Turf Glass Body */}
                <div className="bg-[#0E2C1F]/78 backdrop-blur-xl p-4 sm:p-5 text-white space-y-3.5">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="hero-date-select"
                        className="block text-[11px] font-semibold uppercase tracking-wider text-white/75 mb-1"
                      >
                        Date
                      </label>
                      <div className="relative">
                        <Calendar
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#32CD75]"
                          aria-hidden="true"
                        />
                        <select
                          id="hero-date-select"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-white/12 border border-white/20 text-sm font-semibold text-white focus:outline-none focus:border-[#32CD75] focus-visible:ring-2 focus-visible:ring-[#32CD75] cursor-pointer"
                        >
                          {days.map((day, idx) => (
                            <option
                              key={day.dateStr}
                              value={day.dateStr}
                              className="bg-[#123D2B] text-white"
                            >
                              {idx === 0
                                ? `Aujourd’hui · ${day.dayNumber} ${day.monthShort}`
                                : idx === 1
                                  ? `Demain · ${day.dayNumber} ${day.monthShort}`
                                  : `${day.weekdayShort} ${day.dayNumber} ${day.monthShort}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="hero-hour-select"
                        className="block text-[11px] font-semibold uppercase tracking-wider text-white/75 mb-1"
                      >
                        Heure
                      </label>
                      <div className="relative">
                        <Clock
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#32CD75]"
                          aria-hidden="true"
                        />
                        <select
                          id="hero-hour-select"
                          value={selectedHour}
                          onChange={(e) => setSelectedHour(Number(e.target.value))}
                          className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-white/12 border border-white/20 text-sm font-semibold text-white tabular-nums focus:outline-none focus:border-[#32CD75] focus-visible:ring-2 focus-visible:ring-[#32CD75] cursor-pointer"
                        >
                          {TIME_SLOTS.map((slot) => (
                            <option
                              key={slot.hour}
                              value={slot.hour}
                              className="bg-[#123D2B] text-white"
                            >
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Format selector + Search CTA */}
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/75 mb-1">
                        Format du terrain
                      </span>
                      <div
                        role="group"
                        aria-label="Format du terrain"
                        className="inline-flex w-full sm:w-auto items-center gap-1 p-1 rounded-xl bg-white/10 border border-white/15"
                      >
                        {FIELD_FORMATS.map((format) => {
                          const isActive = selectedFormat === format;
                          return (
                            <button
                              key={format}
                              type="button"
                              onClick={() => setSelectedFormat(format)}
                              aria-pressed={isActive}
                              className={`flex-1 sm:flex-initial min-h-[38px] px-3 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32CD75] cursor-pointer ${
                                isActive
                                  ? 'bg-white text-[#123D2B] shadow-xs'
                                  : 'text-white/80 hover:text-white'
                              }`}
                            >
                              {format}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-[#32CD75] hover:bg-[#29B866] active:scale-[0.99] text-[#123D2B] font-hero text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Rechercher</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
