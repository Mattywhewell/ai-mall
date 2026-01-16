'use client';

import Hero from '@/components/Hero';

export default function TestHeroPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="w-full max-w-4xl p-8">
        <Hero />
      </div>
    </main>
  );
}
