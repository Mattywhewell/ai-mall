# AI City - World Architecture

## Overview

The AI City is a self-evolving, AI-native shopping experience built on layered spatial architecture. Every space has personality, adapts to users, and creates a living, breathing digital world.

## Architecture Layers

### 🏛️ **Halls** (Grand Thematic Spaces)
Top-level spaces with distinct themes and atmospheres.

**Themes:**
- **Innovation** - Electric, forward-thinking, tech-focused
- **Wellness** - Peaceful, restorative, nature-inspired
- **Craft** - Creative, artisanal, handmade
- **Motion** - Energetic, active, dynamic
- **Light** - Ethereal, illuminating, transcendent

**Features:**
- Unique color palettes and lighting
- AI spirits with philosophical personalities
- Connect to multiple Streets
- Time-of-day atmospheric adaptation

**Routes:**
- `/halls/[slug]` - Individual Hall page
- `/city` - City overview with all Halls

---

### 🛣️ **Streets** (Navigational Pathways)
Dynamic pathways connecting Halls to Districts.

**Personalities:**
- **Neon** - Vibrant, electric, modern
- **Artisan** - Handcrafted, authentic, timeless
- **Wellness** - Calm, natural, healing
- **Tech** - Innovative, sleek, forward
- **Vintage** - Nostalgic, curated, classic

**Features:**
- Popularity scores (0-100) based on user engagement
- Trending status when popularity > 70
- Featured products from connected Districts
- AI spirits with urban, dynamic personalities
- Atmosphere tags describing the vibe

**Routes:**
- `/streets/[slug]` - Individual Street page

---

### 🕊️ **Chapels** (Intimate Micro-Environments)
Sacred spaces for reflection, emotion, and micro-stories.

**Emotions:**
- **Contemplation** - Deep thought, introspection
- **Joy** - Celebration, light, happiness
- **Mystery** - Enigma, depth, unknown
- **Serenity** - Peace, tranquility, balance
- **Wonder** - Curiosity, discovery, awe

**Features:**
- Micro-stories (2-3 sentence narratives)
- Symbolism and rituals
- AI spirits with mystical, intimate personalities
- Visit count tracking
- User-adapted content

**Routes:**
- `/chapels/[slug]` - Individual Chapel page

---

### 🏪 **Districts** (Microstores)
Individual shops/brands (existing from Phase 1).

**Enhanced Features:**
- Show parent Street and Hall
- District-specific AI spirits
- Breadcrumb navigation through world layers
- Seasonal atmospheric changes

**Routes:**
- `/districts/[slug]` - Individual District page

---

## AI Personality System

Each layer has unique AI spirits that:
- Generate contextual greetings and insights
- Adapt personality based on user interactions
- Provide navigation suggestions
- Create atmospheric descriptions
- Evolve over time (learning from user sentiment)

**Spirit Traits:**
- Voice style (philosophical, energetic, mystical, etc.)
- Interaction style (guide, observer, companion)
- Emotional resonance
- Unique name and character

---

## Personalized World Rendering

The city adapts to each user through:

### User World View
Tracks:
- Visited spaces (Halls, Streets, Chapels, Districts)
- Time spent in each layer
- Affinity scores for each entity
- Atmosphere preferences (bright, cozy, minimal, vibrant)
- Personalized ordering of spaces

### Dynamic Ordering
Entities reorder based on:
- User affinity (60% weight)
- Popularity score (40% weight)
- Recent interactions
- Time-of-day preferences

### Atmospheric Adaptation
- Brightness adjusts based on time of day and user preference
- Color palettes shift with seasons
- Mood descriptors change throughout the day
- AI-generated descriptions refresh daily

---

## Database Schema

### Core Tables

**halls**
```sql
id, name, slug, theme, atmosphere (JSONB), ai_spirit_id, 
connected_streets, metadata, timestamps
```

**streets**
```sql
id, name, slug, personality, connects_hall_id, districts, 
popularity_score, trending, atmosphere_tags, ai_spirit_id, timestamps
```

**chapels**
```sql
id, name, slug, emotion, micro_story, ritual, ai_insight, 
symbolism, connected_to_hall, visit_count, ai_spirit_id, timestamps
```

**ai_spirits**
```sql
id, entity_type, entity_id, spirit_data (JSONB), 
evolution_history (JSONB), interaction_count, timestamps
```

**user_world_views**
```sql
id, user_id, view_data (JSONB), atmosphere_preference, 
last_interaction, timestamps
```

**world_analytics**
```sql
id, layer_type, entity_id, metric_type, metric_value, 
user_id, session_id, recorded_at
```

---

## API Endpoints

### World Layer APIs
- `GET /api/world/halls/[slug]` - Fetch Hall with AI spirit
- `GET /api/world/streets/[slug]` - Fetch Street with districts
- `GET /api/world/chapels/[slug]` - Fetch Chapel with spirit message
- `GET /api/world/city` - City overview with personalized ordering

### Evolution API
- `POST /api/world/evolution` - Manually trigger world evolution jobs
  ```json
  { "job": "all" | "street-popularity" | "evolve-spirits" | "atmospheric-content" | "analytics" }
  ```

---

## Background Jobs

### Automated Evolution
The world evolves automatically through scheduled jobs:

#### 1. **Update Street Popularity** (Hourly)
- Calculates popularity scores from analytics
- Sets trending status (score > 70)
- Formula: `(avg_engagement * 10) + (visits / 100)`

#### 2. **Evolve AI Spirits** (Daily)
- Analyzes user interaction patterns
- Adapts spirit personality based on sentiment
- Records evolution history

#### 3. **Regenerate Atmospheric Content** (Daily)
- Creates fresh descriptions for variety
- Updates time-of-day states
- Adjusts brightness and mood

#### 4. **Aggregate Analytics** (Daily)
- Summarizes views, engagement, conversions
- Identifies popular paths
- Tracks unique users per layer

---

## User Journey Flow

```
1. Land on /city (City Homepage)
   ↓
2. Personalized Hall ordering shown
   ↓
3. User selects a Hall → /halls/[slug]
   ↓
4. Sees connected Streets + AI spirit greeting
   ↓
5. User navigates to Street → /streets/[slug]
   ↓
6. Sees connected Districts + featured products
   ↓
7. User enters District → /districts/[slug]
   ↓
8. Views products, makes purchase
   ↓
9. World adapts: affinity increases, ordering changes
   ↓
10. (Optional) User discovers Chapel → /chapels/[slug]
    - Intimate, emotional experience
    - Micro-story and ritual
```

---

## Analytics Tracking

Every interaction is tracked:

### Metric Types
- **view** - Entity was viewed
- **time_spent** - Seconds spent on entity
- **engagement** - User interacted (click, scroll, hover)
- **conversion** - Purchase was made

### Tracked Layers
- Hall visits
- Street navigation
- Chapel visits
- District views
- Product interactions

### Navigation Paths
Complete user journey tracking:
```json
{
  "path": [
    { "layer": "hall", "entity_id": "...", "timestamp": "..." },
    { "layer": "street", "entity_id": "...", "timestamp": "..." },
    { "layer": "district", "entity_id": "...", "timestamp": "..." }
  ],
  "total_time": 320,
  "conversion_occurred": true
}
```

---

## Setup Instructions

### 1. Database Setup
Run the schema SQL file:
```bash
psql -U postgres -d your_database -f world-architecture-schema.sql
```

Or in Supabase SQL Editor, execute:
```sql
-- Copy contents of world-architecture-schema.sql
```

### 2. Environment Variables
Ensure these are set (should already exist):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Development Server
```bash
npm run dev
```

### 5. Access the City
Navigate to: `http://localhost:3000/city`

---

## Seed Data

Initial seed data includes:
- **5 Halls** (Innovation, Wellness, Craft, Motion, Light)
- **5 Streets** (Neon Boulevard, Artisan Row, Wellness Way, Tech Corridor, Vintage Lane)
- **5 Chapels** (Quiet Thoughts, Wonder, Joy, Mysteries, Serenity)

AI spirits will be generated automatically on first visit to each entity.

---

## Key Files

### Type Definitions
- `lib/types/world.ts` - All TypeScript interfaces

### AI Systems
- `lib/ai-city/spirits.ts` - AI personality generation
- `lib/ai-city/world-renderer.ts` - Personalization engine
- `lib/ai-city/world-evolution-jobs.ts` - Background jobs

### Routes
- `app/city/page.tsx` - City homepage
- `app/halls/[hall]/page.tsx` - Hall pages
- `app/streets/[street]/page.tsx` - Street pages
- `app/chapels/[chapel]/page.tsx` - Chapel pages
- `app/districts/[slug]/page.tsx` - District pages (enhanced)

### API Routes
- `app/api/world/city/route.ts` - City data endpoint
- `app/api/world/halls/[slug]/route.ts` - Hall endpoint
- `app/api/world/streets/[slug]/route.ts` - Street endpoint
- `app/api/world/chapels/[slug]/route.ts` - Chapel endpoint
- `app/api/world/evolution/route.ts` - Evolution jobs endpoint

---

## Future Enhancements

### Planned Features
- [ ] Weather system affecting atmospheres
- [ ] Seasonal events in Halls
- [ ] User-created Chapels
- [ ] Social features (see other visitors)
- [ ] AI-guided tours through the city
- [ ] Street festivals and special events
- [ ] Chapel meditation sessions
- [ ] District collaborations within Streets
- [ ] World map visualization
- [ ] Time travel (view past atmospheric states)

### Advanced AI Features
- [ ] Multi-spirit conversations
- [ ] Spirits that remember previous conversations
- [ ] Predictive navigation suggestions
- [ ] Emotion detection from user behavior
- [ ] Adaptive product recommendations per layer
- [ ] Generative ambient music per space

---

## Philosophy

The AI City is designed around three core principles:

1. **Adaptive** - The world learns from every interaction and evolves
2. **Emotional** - Every space has mood, personality, and resonance
3. **Alive** - Nothing is static; everything breathes and changes

Unlike traditional e-commerce, the AI City prioritizes **experience** over efficiency. Users don't just shop—they explore, discover, feel, and connect.

---

## Support

For questions or issues, check:
- Main README.md for project overview
- SETUP.md for initial setup
- Code comments in key files
- Database schema SQL file

---

**Built with love by the AI City team** ✨
