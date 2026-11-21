'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-line-strong hover:bg-[#9c3703] text-canvas text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Installer</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-ink hover:bg-pitch text-canvas text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Installer</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Installer sur iPhone ou iPad"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white text-[#16231b] p-5 shadow-xl border border-[#16231b]/15">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-2xl font-bold text-[#16231b]">
                  Installer l&apos;application
                </h2>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Fermer"
                  className="min-h-[44px] min-w-[44px] -mt-1 -mr-2 flex items-center justify-center rounded-lg text-[#16231b]/70 hover:bg-[#16231b]/5 focus-visible:outline-2 focus-visible:outline-[#e8590c]"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[#16231b]/85 list-decimal list-inside">
                <li>
                  Touchez le bouton <strong>Partager</strong> dans Safari.
                </li>
                <li>
                  Sélectionnez <strong>Sur l&apos;écran d&apos;accueil</strong>.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full min-h-[48px] rounded-xl bg-[#1f5d3a] text-white text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
