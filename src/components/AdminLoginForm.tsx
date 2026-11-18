'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { authClient } from '@/src/lib/auth-client';

interface AdminLoginFormProps {
  initialError?: string | null;
}

export function AdminLoginForm({ initialError = null }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setError('Identifiants incorrects ou accès refusé.');
        setIsSubmitting(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="admin-email"
          className="block text-xs font-semibold text-[#16231b] mb-1.5"
        >
          Adresse e-mail du gérant
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="gerant@elitesportgodomey.bj"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#f8f7f2] border border-[#16231b]/20 text-base text-[#16231b] placeholder:text-[#16231b]/40 focus:outline-none focus:border-[#1f5d3a] focus:ring-2 focus:ring-[#1f5d3a]/20"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-xs font-semibold text-[#16231b] mb-1.5"
        >
          Mot de passe
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#f8f7f2] border border-[#16231b]/20 text-base text-[#16231b] placeholder:text-[#16231b]/40 focus:outline-none focus:border-[#1f5d3a] focus:ring-2 focus:ring-[#1f5d3a]/20"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm font-semibold text-[#c93800] bg-[#e8590c]/10 border border-[#e8590c]/30 rounded-xl px-3.5 py-2.5"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-[#1f5d3a] hover:bg-[#17482c] active:scale-[0.99] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{isSubmitting ? 'Connexion...' : 'Se connecter'}</span>
      </button>
    </form>
  );
}
