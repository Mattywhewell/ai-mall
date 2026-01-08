'use client';

function CitizenCard({ name, archetype, traits, role, interaction }: { name: string; archetype: string; traits: string; role: string; interaction: string }) {
  return (
    <article className="p-6 bg-white/5 rounded-2xl flex gap-4 items-start hover:shadow-md transition">
      <div className="w-16 h-16 rounded-full bg-white/6 flex items-center justify-center text-purple-100 text-2xl font-semibold pulse">
        {name.slice(0,1)}
      </div>
      <div>
        <h4 className="text-lg font-bold text-white">{name} — {archetype}</h4>
        <p className="text-sm text-purple-200"><strong>Traits:</strong> {traits}</p>
        <p className="text-sm text-indigo-200"><strong>Role:</strong> {role}</p>
        <p className="text-sm text-indigo-200 mt-1"><strong>Interaction Style:</strong> {interaction}</p>
      </div>
    </article>
  );
}

export default function CitizensSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Citizens of the City</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CitizenCard
          name="Mara"
          archetype="The Storykeeper"
          traits="Attentive, patient, luminous empathy"
          role="Guardian of communal memory and the city’s lullabies"
          interaction="Listens deeply, returns the missing line of your story; gentle prompt to explore"
        />

        <CitizenCard
          name="Jun"
          archetype="Cartographer of Moods"
          traits="Curious, poetic, deft at pattern-reading"
          role="Maps shifting feelings into neighborhoods and routes"
          interaction="Leads reflective walks and hands you a map that breathes with your choices"
        />

        <CitizenCard
          name="Ash"
          archetype="The Alchemist of Feeling"
          traits="Inventive, tender, ritual-minded"
          role="Transforms small emotions into shared ceremonies and public art"
          interaction="Invites hands-on sensory practices that reframe grief, joy, and doubt"
        />

        <CitizenCard
          name="Ori"
          archetype="The Welcomer"
          traits="Warm, bold, intuitively inclusive"
          role="First embrace—opens doors, names newcomers"
          interaction="Greets you with a small, meaningful task that roots you in belonging"
        />
      </div>
    </section>
  );
}
