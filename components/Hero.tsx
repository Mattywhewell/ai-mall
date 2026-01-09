import Link from 'next/link';
import Image from 'next/image';
import { COLORS, TYPO } from '@/lib/designTokens';

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TYPO } from '@/lib/designTokens';

export default function Hero() {
  const [variant, setVariant] = useState<'a'|'b'>('a');

  useEffect(() => {
    // Persist A/B variant in localStorage and allow override via ?ab=b
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('ab');
      const stored = localStorage.getItem('hero_variant');
      let v: 'a'|'b' = (stored as 'a'|'b') || 'a';
      if (q === 'b') v = 'b';
      if (!stored) localStorage.setItem('hero_variant', v);
      setVariant(v);
    } catch (e) {
      // no-op
    }
  }, []);

  return (
    <section className={`relative overflow-hidden py-24 md:py-32 hero-compact hero-variant-${variant}`}>
      {/* Animated background shapes */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#2F076A] via-[#5A2EBE] to-[#FF6AA3] opacity-80 hero-bg-blur"></div>

        {/* floating lantern graphics */}
        <svg className="absolute -left-10 -top-10 w-56 h-56 hero-lantern opacity-90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="url(#g)" />
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="#FFDDAA" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF6AA3" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="mb-2 flex justify-end">
          {/* Profile/aviator icon handled in Navbar */}
        </div>

        <div className="flex items-center justify-center mb-4">
          <div className="mr-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-[#FFC87A]">
              <circle cx="12" cy="12" r="10" fill="#FFC87A" opacity="0.12" />
            </svg>
          </div>
          <h1 className={`${TYPO.h1} text-ivory bg-clip-text text-transparent bg-gradient-to-r from-[#FFF6EE] to-[#FFDDAA]`}>
            {variant === 'a' ? 'Enter the City Where Memory Takes Shape' : 'A Living City of Moods and Meaning'}
          </h1>
        </div>

        <p className={`hero-sub text-lg md:text-xl italic mb-3 max-w-3xl mx-auto ${variant === 'b' ? 'text-pink-100' : 'text-indigo-200'}`}>
          {variant === 'a' ? 'Lanterns hum with memory; streets learn your rhythm and answer in light.' : 'Step into a gentle city where attention becomes a public craft.'}
        </p>

        <p className="text-md md:text-lg text-indigo-200 mb-6 max-w-3xl mx-auto leading-relaxed"> 
          {variant === 'a' ? 'Aiverse opens like a warm mouth of stories—each street listens and rearranges itself to meet your curiosity.' : 'Discover districts that remember you; creators, AI citizens, and rituals that grow with your attention.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link
            href="/city"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform transition hover:scale-105"
            style={{ background: 'linear-gradient(90deg,#7C3AED,#FF6AA3)', boxShadow: '0 10px 30px rgba(124,58,237,0.18)' }}
          >
            {variant === 'a' ? 'Enter the City' : 'Explore the City'}
          </Link>

          <Link
            href="/creator"
            className="inline-flex items-center justify-center px-6 py-4 rounded-full text-lg font-semibold bg-white/10 hover:bg-white/20 transition"
          >
            Become a Creator
          </Link>
        </div>

        {/* subtle hero image for visual interest */}
        <div className="mt-6">
          <Image src="/hero/city-mid.svg" alt="Aiverse city" width={900} height={280} className="mx-auto opacity-90" />
        </div>

      </div>
    </section>);
}
          </Link>
        </div>

        {/* Small preview of citizens (hires images if present, fallback to SVG placeholders) */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {[1, 2, 3, 4].map((i) => (
            <picture key={i}>
              <source
                type="image/webp"
                srcSet={`/citizens/variants/illustrated/citizen-${i}--illustrated.webp, /citizens/variants/illustrated/citizen-${i}--illustrated@2x.webp 2x`}
              />
              <source
                type="image/webp"
                srcSet={`/citizens/hires/citizen-${i}.webp, /citizens/hires/citizen-${i}@2x.webp 2x`}
              />
              <img
                src={`/citizens/hires/citizen-${i}.png`}
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  t.onerror = null;
                  t.src = `/citizens/citizen-${i}.svg`;
                }}
                width={64}
                height={64}
                alt={`Citizen ${i}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/10 shadow-sm"
              />
            </picture>
          ))}
        </div>

        {/* Decorative floating elements (purely presentational) */}
        <div className="pointer-events-none absolute -left-12 -bottom-12 opacity-30">
          <div className="w-40 h-40 rounded-full bg-white/4 blur-xl"></div>
        </div>
      </div>
    </section>
  );
}
