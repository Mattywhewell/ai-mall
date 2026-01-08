'use client';

import Link from 'next/link';

export default function CreatorInvitation() {
  return (
    <section className="w-full bg-gradient-to-r from-[#3A0F7F] to-[#7C3AED] py-14 mb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">Creators, Bring Your Work to Life</h3>
        <p className="text-lg text-purple-100 mb-6">In Aiverse, what you build becomes streets, chapels, companions, and public rituals that grow with neighbors and time. The city provides mentors, shared spaces, and rituals that care for creation so craft and care flourish together.</p>
        <Link href="/creator/begin" className="inline-block px-8 py-4 rounded-full font-semibold text-[#3A0F7F] bg-white hover:scale-105 transition">Begin Creating</Link>
      </div>
    </section>
  );
}
