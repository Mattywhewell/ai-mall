'use client';

export default function DistrictCard({ name, description, purpose, hint }: { name: string; description: string; purpose: string; hint: string }) {
  return (
    <article className="group bg-white/5 rounded-2xl p-6 hover:shadow-2xl transition transform hover:-translate-y-1 focus-within:scale-102">
      <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
      <p className="text-sm text-purple-200 mb-3">{description}</p>

      <div className="mt-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-220">
        <p className="text-sm text-indigo-200"><strong>Emotional Purpose:</strong> {purpose}</p>
        <p className="text-sm text-indigo-200 mt-1">{hint}</p>
      </div>
    </article>
  );
}
