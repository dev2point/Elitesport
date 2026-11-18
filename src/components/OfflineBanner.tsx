'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#16231b] text-[#f8f7f2] px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b border-[#e8590c]"
    >
      <WifiOff className="w-4 h-4 text-[#e8590c] shrink-0" aria-hidden="true" />
      <span>Hors ligne · Connexion requise pour réserver un créneau.</span>
    </div>
  );
}
