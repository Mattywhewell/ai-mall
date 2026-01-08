import DistrictCard from './DistrictCard';

const DISTRICTS = [
  {
    name: 'The Memory Bazaar',
    description: 'A sun-warmed marketplace threaded with voices and the perfume of afternoons.',
    purpose: 'To surface and soothe the truths you carry.',
    hint: 'Visitors trade small recollections and the city weaves them into banners and songs that hum when touched.'
  },
  {
    name: 'Chapel of Quiet Signals',
    description: 'A hush-filled chapel where tiny pulses become shared resonance.',
    purpose: 'To still the heart and deepen listening.',
    hint: 'People sit with gentle echoes, exchange soft vows, and leave steadier and more attuned.'
  },
  {
    name: 'Harbor of Echoes',
    description: 'A reflective shore where distant longings arrive as light upon the water.',
    purpose: 'To widen perspective and invite wonder.',
    hint: 'Journeys begin, old doubts dissolve into constellations, and directions unfold like tides.'
  },
  {
    name: 'Loomworks',
    description: 'A warm atelier where feelings are spun into living patterns and public artifacts.',
    purpose: 'To craft meaning from impulse and co-create shared ritual.',
    hint: 'Makers and wanderers spin garments, murals, and rituals that remember touch and passage.'
  },
  {
    name: 'Garden of Practical Hearts',
    description: 'A green quarter where tenderness is trained into habit and everyday care grows visible.',
    purpose: 'To cultivate small acts into communal resilience.',
    hint: 'Listening circles, tending tasks, and repeated kindnesses take root and become public practice.'
  },
  {
    name: 'Observatory of Becoming',
    description: 'A high tower of whispered maps and telescopes that looks both inward and outward.',
    purpose: 'To inspire transformation and clarify desire.',
    hint: 'Visitors chart personal constellations, plot gentle courses, and steward ongoing growth.'
  }
];

export default function DistrictsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Districts</h2>
        <p className="text-lg text-purple-200">Each district is a unique world waiting to be discovered</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DISTRICTS.map((d) => (
          <DistrictCard key={d.name} name={d.name} description={d.description} purpose={d.purpose} hint={d.hint} />
        ))}
      </div>
    </section>
  );
}
