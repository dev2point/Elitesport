'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavLinkItem {
  href: string;
  label: string;
  matchPrefix?: string;
}

const NAV_LINKS: readonly NavLinkItem[] = [
  { href: '/', label: 'Accueil' },
  { href: '/reserver', label: 'Terrains', matchPrefix: '/reserver' },
  { href: '/#comment-ca-marche', label: 'Comment ça marche' },
  { href: '/#a-propos', label: 'À propos' },
];

interface NavbarProps {
  variant?: 'solid' | 'hero';
}

export function Navbar({ variant = 'solid' }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHero = variant === 'hero';

  function isActiveLink(item: NavLinkItem): boolean {
    if (item.href === '/') {
      return pathname === '/';
    }
    if (item.matchPrefix) {
      return pathname.startsWith(item.matchPrefix);
    }
    return false;
  }

  return (
    <header
      className={
        isHero
          ? 'relative z-20'
          : 'sticky top-0 z-30 border-b border-[#123D2B]/10 bg-[#F8FAF7]/88 backdrop-blur-md'
      }
    >
      <div
        className={
          isHero
            ? 'flex h-14 sm:h-16 items-center justify-between gap-4 rounded-full border border-white/18 bg-[#123D2B]/40 px-3.5 sm:px-5 backdrop-blur-md md:gap-8'
            : 'mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-8 md:gap-8'
        }
      >
        {/* Zone 1: Brand wordmark */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`inline-flex min-h-[44px] items-center rounded-sm font-hero text-lg sm:text-xl font-extrabold tracking-[-0.03em] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 ${
            isHero
              ? 'text-white focus-visible:outline-[#32CD75]'
              : 'text-[#123D2B] focus-visible:outline-[#123D2B]'
          }`}
        >
          TERRAIN
        </Link>

        {/* Zone 2: Single-line navigation links */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-6 lg:gap-8"
        >
          {NAV_LINKS.map((item) => {
            const active = isActiveLink(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex min-h-[44px] items-center font-body text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isHero
                    ? active
                      ? 'text-white font-semibold focus-visible:outline-[#32CD75]'
                      : 'text-white/80 hover:text-white focus-visible:outline-[#32CD75]'
                    : active
                      ? 'text-[#123D2B] font-semibold focus-visible:outline-[#123D2B]'
                      : 'text-[#55635B] hover:text-[#17231D] focus-visible:outline-[#123D2B]'
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <motion.span
                    layoutId={`navbar-active-underline-${variant}`}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-0 bottom-2 h-0.5 bg-[#32CD75] rounded-full"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Connexion + primary CTA + mobile drawer button */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <Link
            href="/admin"
            className={`hidden md:inline-flex min-h-[44px] items-center font-body text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isHero
                ? 'text-white/85 hover:text-white focus-visible:outline-[#32CD75]'
                : 'text-[#17231D]/80 hover:text-[#123D2B] focus-visible:outline-[#123D2B]'
            }`}
          >
            Connexion
          </Link>

          <Link
            href="/reserver"
            className={`group min-h-[40px] sm:min-h-[44px] rounded-full pl-3.5 sm:pl-4 pr-1.5 py-1.5 font-body text-xs sm:text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isHero
                ? 'bg-white text-[#123D2B] hover:bg-[#F8FAF7] focus-visible:outline-[#32CD75] shadow-sm'
                : 'bg-[#123D2B] text-[#F8FAF7] hover:bg-[#0C2B1E] focus-visible:outline-[#123D2B] shadow-xs'
            }`}
          >
            <span className="sm:hidden">Réserver</span>
            <span className="hidden sm:inline">Réserver un terrain</span>
            <span
              className={`inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-transform duration-150 group-hover:translate-x-0.5 ${
                isHero
                  ? 'bg-[#123D2B] text-white'
                  : 'bg-[#32CD75] text-[#123D2B]'
              }`}
              aria-hidden="true"
            >
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls={`mobile-nav-drawer-${variant}`}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className={`md:hidden h-10 w-10 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isHero
                ? 'bg-white text-[#123D2B] hover:bg-[#F8FAF7] focus-visible:outline-[#32CD75]'
                : 'border border-[#123D2B]/15 bg-white text-[#17231D] hover:border-[#123D2B] focus-visible:outline-[#123D2B]'
            }`}
          >
            {mobileOpen ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id={`mobile-nav-drawer-${variant}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={
              isHero
                ? 'md:hidden mt-2 rounded-2xl border border-white/20 bg-[#123D2B]/95 backdrop-blur-xl p-3 text-white shadow-xl'
                : 'md:hidden overflow-hidden border-t border-[#123D2B]/10 bg-[#F8FAF7]'
            }
          >
            <nav
              aria-label="Menu mobile"
              className="mx-auto max-w-6xl px-1 py-1 flex flex-col gap-1"
            >
              {NAV_LINKS.map((item) => {
                const active = isActiveLink(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`min-h-[44px] px-3.5 rounded-xl flex items-center justify-between font-body text-sm font-semibold transition-colors ${
                      isHero
                        ? active
                          ? 'bg-white text-[#123D2B]'
                          : 'text-white/90 hover:bg-white/10'
                        : active
                          ? 'bg-[#123D2B] text-[#F8FAF7]'
                          : 'text-[#17231D] hover:bg-[#123D2B]/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-75" aria-hidden="true" />
                  </Link>
                );
              })}

              <div
                className={`mt-2 pt-2.5 border-t flex flex-wrap items-center justify-between gap-3 px-2 ${
                  isHero ? 'border-white/15' : 'border-[#123D2B]/10'
                }`}
              >
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`min-h-[44px] px-2 inline-flex items-center font-body text-sm font-semibold underline underline-offset-4 ${
                    isHero ? 'text-white/90 hover:text-white' : 'text-[#17231D]'
                  }`}
                >
                  Connexion
                </Link>
                <PWAInstallButton />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
