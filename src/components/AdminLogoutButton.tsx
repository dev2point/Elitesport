'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/src/lib/auth-client';

export function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    try {
      await authClient.signOut();
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-white/12 hover:bg-white/20 text-[#f8f7f2] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f8f7f2] transition-colors cursor-pointer"
    >
      <LogOut className="w-4 h-4" aria-hidden="true" />
      <span>{isPending ? 'Déconnexion...' : 'Déconnexion'}</span>
    </button>
  );
}
