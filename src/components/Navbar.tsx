'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavLinkItem {
  href: string;
  label: string;
  matchPrefix?: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/', label: 'Accueil' },
  { href: '/reserver', label: 'Créneaux', matchPrefix: '/reserver' },
  { href: '/#tarifs', label: 'Tarifs' },
  { href: '/legals', label: 'Légal', matchPrefix: '/legals' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isBookingPage = pathname === '/reserver';

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
    <>
      <div className="h-1 w-full bg-[#e8590c]" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-[#16231b]/10 bg-[#f8f7f2]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-3.5 sm:h-16 sm:px-4 md:gap-8">
          {/* Zone 1: Single clean wordmark */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="inline-flex min-h-[44px] items-center rounded-sm font-display text-xl font-bold tracking-tight leading-none text-[#16231b] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84304] sm:text-2xl"
          >
            Élite Sport Godomey
          </Link>

          {/* Zone 2: Concise single-line nav links (desktop) */}
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
                  className={`relative inline-flex min-h-[44px] items-center text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84304] ${
                    active
                      ? 'text-[#1f5d3a]'
                      : 'text-[#3c4a41] hover:text-[#16231b]'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="navbar-active-underline"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-x-0 bottom-1.5 h-0.5 bg-[#e8590c] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Single primary CTA + mobile drawer toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={isBookingPage ? '/#tarifs' : '/reserver'}
              className={`min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-4 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16231b] ${
                isBookingPage
                  ? 'border border-[#16231b]/20 bg-white text-[#16231b] hover:border-[#1f5d3a]'
                  : 'bg-[#c94705] hover:bg-[#b23d03] text-white'
              }`}
            >
              <span>{isBookingPage ? 'Tarifs' : 'Réserver'}</span>
              {!isBookingPage && (
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#16231b]/15 bg-white text-[#16231b] hover:border-[#1f5d3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84304] cursor-pointer"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-nav-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-[#16231b]/10 bg-[#f8f7f2]"
            >
              <nav
                aria-label="Menu mobile"
                className="mx-auto max-w-5xl px-3.5 py-3 flex flex-col gap-1"
              >
                {NAV_LINKS.map((item) => {
                  const active = isActiveLink(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`min-h-[44px] px-3 rounded-xl flex items-center justify-between text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84304] ${
                        active
                          ? 'bg-[#1f5d3a] text-[#f8f7f2]'
                          : 'text-[#16231b] hover:bg-[#16231b]/5'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="w-4 h-4 opacity-70" aria-hidden="true" />
                    </Link>
                  );
                })}

                <div className="mt-2 pt-2 border-t border-[#16231b]/10 flex items-center justify-between gap-3">
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="min-h-[44px] px-3 inline-flex items-center text-sm font-medium text-[#3c4a41] underline underline-offset-4 hover:text-[#16231b]"
                  >
                    Espace gérant
                  </Link>
                  <PWAInstallButton />
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
