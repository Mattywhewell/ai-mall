'use client';

import Link from 'next/link';
import { COLORS, TYPO } from '@/lib/designTokens';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#2F076A] via-[#5A2EBE] to-[#FF6AA3] opacity-80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/6 to-transparent mix-blend-overlay"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="mb-6 flex justify-end">
          {/* Profile/aviator icon handled in Navbar */}
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="mr-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-[#FFC87A]">
              <circle cx="12" cy="12" r="10" fill="#FFC87A" opacity="0.12" />
            </svg>
          </div>
          <h1 className={`${TYPO.h1} text-ivory bg-clip-text text-transparent bg-gradient-to-r from-[#FFF6EE] to-[#FFDDAA]`}>
            Enter the City Where Memory Takes Shape
          </h1>
        </div>

        <p className="text-lg md:text-xl text-indigo-200 italic mb-6 max-w-3xl mx-auto">
          Lanterns hum with memory; streets learn your rhythm and answer in light.
        </p>

        <p className="text-lg md:text-xl text-indigo-200 mb-10 max-w-3xl mx-auto"> 
          Aiverse opens like a warm mouth of stories—each street listens and rearranges itself to meet your curiosity. Sensory lanes braid scent, sound, and ritual into architecture; attention becomes public work. Walk through warm light and the world will learn you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/city"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform transition hover:scale-105"
            style={{ background: 'linear-gradient(90deg,#7C3AED,#FF6AA3)', boxShadow: '0 10px 30px rgba(124,58,237,0.18)' }}
          >
            Enter the City
          </Link>

          <Link
            href="/creator"
            className="inline-flex items-center justify-center px-6 py-4 rounded-full text-lg font-semibold bg-white/10 hover:bg-white/20 transition"
          >
            Become a Creator
          </Link>
        </div>

        {/* Decorative floating elements (purely presentational) */}
        <div className="pointer-events-none absolute -left-12 -bottom-12 opacity-30">
          <div className="w-40 h-40 rounded-full bg-white/4 blur-xl"></div>
        </div>
      </div>
    </section>
  );
}
