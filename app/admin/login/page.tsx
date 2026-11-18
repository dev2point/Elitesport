import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminLoginForm } from '@/src/components/AdminLoginForm';
import { getAdminSession } from '@/src/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const existingAdminSession = await getAdminSession();
  if (existingAdminSession) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#16231b] flex flex-col">
      <div className="h-1 w-full bg-[#e8590c]" aria-hidden="true" />

      <header className="bg-[#1f5d3a] text-[#f8f7f2] border-b border-[#16231b]/15">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-none">
              Élite Sport Godomey
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#f8f7f2]/85">
              Espace gérant · Connexion sécurisée
            </p>
          </div>

          <Link
            href="/"
            className="min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium text-[#f8f7f2] hover:bg-white/10 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Terrain</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8">
        <section className="w-full max-w-md bg-white border border-[#16231b]/12 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-[#16231b]">
            Connexion gérant
          </h2>
          <p className="mt-1 text-sm text-[#16231b]/70">
            Accès réservé à la gestion des réservations du terrain.
          </p>

          <div className="mt-5">
            <AdminLoginForm />
          </div>
        </section>
      </main>
    </div>
  );
}
