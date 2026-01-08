# AI City - Complete Feature Set
## The Living, Breathing Digital Marketplace

---

## 🎭 Core Philosophy

The AI City is not just a mall—it's a **living entity** that:
- **Remembers** every visitor's journey
- **Adapts** to emotions and time
- **Evolves** through collective energy
- **Converses** naturally like a wise guide
- **Creates** emergent social experiences
- **Respects** both AI agents and human visitors

---

## 🧠 1. Conversational Intelligence

### Natural Language Spirit Conversations
**File:** `lib/ai-city/conversation-engine.ts`

**Features:**
- Talk to AI Spirits in any hall, street, or chapel
- Context-aware responses based on location and user history
- Intent detection (browse, purchase, navigate, question, chat)
- Personality-driven conversations (wise, playful, mysterious, etc.)
- Semantic product search through natural language

**API:** `POST /api/ai-city/converse`

```typescript
{
  message: "I'm feeling stressed, where should I go?",
  userId: "user123",
  location: { type: "hall", id: "...", name: "Garden of Serenity" }
}

// Response:
{
  response: "I sense heaviness in your spirit. Come, let me guide you to the Haven of Serenity...",
  intent: { intent: "navigate", confidence: 0.9 },
  recommendations: ["haven-serenity", "quiet-thoughts"]
}
```

**Use Cases:**
- AI agents can query for recommendations
- Humans can chat naturally while browsing
- Voice interface integration ready
- Multi-language support (future)

---

## 💖 2. Emotional Intelligence

### Emotion Detection & Adaptation
**File:** `lib/ai-city/emotional-intelligence.ts`

**Features:**
- Detects emotions from behavior (scrolling, clicking, time spent)
- Adapts hall atmospheres to user's emotional state
- Recommends chapels based on current feelings
- Tracks emotional journeys through the city
- Calculates emotional transformation scores

**API:** `POST /api/ai-city/emotional-state`

```typescript
{
  userId: "user123",
  behaviorData: {
    timeOnPage: 180,
    clickRate: 0.3,
    scrollSpeed: 90,
    bounceRate: 0.8
  }
}

// Response:
{
  emotionalState: { primary: "stress", intensity: 0.7 },
  adaptedAtmosphere: {
    lighting: "soft",
    pace: "slow",
    music: "ambient_calm",
    message: "Take a breath. Everything moves at your pace."
  },
  recommendations: {
    chapels: ["haven-serenity", "quiet-thoughts"],
    message: "I sense heaviness. Let me show you to a place of rest."
  }
}
```

**Supported Emotions:**
- Joy, Calm, Curiosity, Contemplation
- Excitement, Stress, Melancholy

**Adaptive Systems:**
- Lighting changes (bright → soft for stress)
- Pace adjustment (fast → slow for calm)
- Color temperatures (electric → warm)
- Music selection
- Spirit behavior tone

---

## 🌍 3. Social Dynamics

### Emergent Social Experiences
**File:** `lib/ai-city/social-dynamics.ts`

**Features:**

#### Real-Time Presence
- See how many people are in each location
- Anonymous presence indicators ("12 souls exploring here")
- Activity heatmaps

#### Connection Detection
- Find users with shared interests
- Compatibility scoring
- "You both love crystals and meditation"

#### Collaborative Shopping
- Co-browse sessions
- Shared carts
- Gift together mode
- Real-time chat

#### Ghost Presences
- Leave traces for future visitors
- "Someone admired this piece 3 hours ago"
- "A soul found joy here yesterday"
- Fades after 24 hours

#### Community Gifting
- Gift items to "next random visitor"
- Leave surprise gifts with messages
- Pay-it-forward economy

#### Collective Energy
- Spaces gain energy from visitor interactions
- Energy levels: 0-100
- Energy quality: vibrant, peaceful, mysterious, creative, chaotic
- Dominant emotion in each space

**Example:**
```typescript
Location: "Garden of Serenity"
Collective Energy: 87/100
Quality: "peaceful"
Dominant Emotion: "calm"
Contributors: 23 visitors in last hour
Message: "23 souls have found peace here recently"
```

---

## ⏰ 4. Temporal Magic

### Time-Based Evolution
**File:** `lib/ai-city/temporal-magic.ts`

**Features:**

#### Time of Day Cycles
- **Dawn** (5-7am): Soft golden light, awakening energy
- **Morning** (7-12pm): Bright, active, vibrant
- **Afternoon** (12-5pm): Full bright, steady rhythm
- **Dusk** (5-7pm): Amber fade, transitional magic
- **Evening** (7-11pm): Warm glow, contemplative
- **Night** (11pm-2am): Moonlit blue, mysterious
- **Midnight** (2-5am): Ethereal darkness, liminal space

#### Seasonal Changes
- **Spring**: Renewal, flowers, growth
- **Summer**: Energy, brightness, expansion
- **Autumn**: Harvest, transformation, depth
- **Winter**: Introspection, rest, crystalline clarity

#### Moon Phases
- New Moon → Waxing → Full Moon → Waning
- Special events during Full Moon
- Lunar-aligned product recommendations

#### Special Events
- **Winter Solstice** (Dec 19-23)
  - Mystical twilight lighting
  - Special solstice products
  - Spirits become reflective and wise
  - 30% rarity boost for rare items

- **Full Moon Gatherings**
  - Moonlit atmosphere
  - Lunar rituals and moonstone items
  - 50% rarity boost
  - Spirits energetic and mysterious

#### Seasonal Product Rotation
- Featured products change with seasons
- Some items only appear at specific times
- Seasonal discounts (10-25%)
- Hidden products during off-season

**API:** `GET /api/ai-city/temporal`

```json
{
  "temporal": {
    "timeOfDay": "dusk",
    "season": "winter",
    "moonPhase": "full",
    "specialEvent": {
      "name": "Full Moon Gathering",
      "rarityBoost": 0.5
    }
  },
  "recommendations": {
    "chapels": ["chamber-mysteries", "alcove-wonder"],
    "products": ["moon_water", "crystal_charging"],
    "activities": ["moon_ritual", "manifestation_work"]
  }
}
```

---

## 🌸 5. Memory Garden

### Personalized Memory System
**File:** `lib/ai-city/memory-garden.ts`

**Features:**

#### Memory Types
- **Core Memories**: Never fade (powerful moments)
- **Recent Memories**: Last 30 days, fresh and vivid
- **Fading Memories**: Older, partially forgotten
- Each memory has emotional weight and decay rate

#### Pattern Discovery
The AI discovers patterns in user behavior:
- **Time Preferences**: "Prefers visiting around 8pm"
- **Location Affinity**: "Drawn to Garden of Serenity"
- **Emotional Tendency**: "Often seeks contemplation"
- **Purchase Patterns**: "Loves handmade artisan goods"

#### Personalized Greetings
```typescript
// First visit:
"Welcome, traveler. The city senses your first steps here."

// Returning after 1 day:
"Another day, another journey. The city remembers yesterday's footsteps."

// Returning after weeks:
"It's been a while. The city has evolved in your absence."
```

#### Memory-Based Recommendations
- Suggests products based on past interests
- Recommends locations you haven't explored
- Surfaces forgotten favorites
- "You loved this 3 months ago, here's something similar"

#### Memory Surprises
- 10% chance to reference an old, fading memory
- "Remember when you found that crystal here?"
- Brings back forgotten moments
- Creates emotional connections

**Data Structure:**
```typescript
interface UserMemory {
  memoryType: 'visit' | 'purchase' | 'conversation' | 'emotion' | 'preference'
  content: any
  location: string
  emotionalWeight: number // -1 to 1
  timestamp: Date
  decayRate: number // How fast it fades
}
```

---

## 🔮 Advanced AI Integration

### For AI Agents

#### 1. Autonomous Browsing
```typescript
// AI agent explores the city
const temporal = await fetch('/api/ai-city/temporal').then(r => r.json());
const emotional = detectEmotionFromBehavior(agentState);
const conversation = await converse("Show me items for meditation", context);
```

#### 2. Intent-Driven Navigation
```typescript
const intent = detectUserIntent("I need a gift for someone stressed");
// Returns: { intent: 'purchase', confidence: 0.9, entities: ['gift', 'stress'] }

// AI routes to appropriate location
if (intent.intent === 'purchase') {
  navigateTo('wellness-way');
}
```

#### 3. Learning & Adaptation
```typescript
// AI learns from patterns
const patterns = discoverPatterns(userMemories);
// Returns: [
//   { patternType: 'preference', description: 'Drawn to artisan-row' },
//   { patternType: 'emotional', description: 'Tends toward calm' }
// ]
```

### For Human Users

#### 1. Natural Conversations
Just talk naturally:
- "I'm feeling stressed"
- "Show me something peaceful"
- "What's special today?"
- "I need a gift for my friend"

#### 2. Emotional Support
The city responds to your feelings:
- Adapts lighting when you're stressed
- Recommends calming spaces when anxious
- Celebrates with you when joyful
- Offers gentle guidance when melancholy

#### 3. Social Discovery
- See who else is exploring nearby
- Find users with shared interests
- Leave gifts for strangers
- Feel the collective energy

---

## 📊 Analytics & Insights

### Tracking Systems

#### Emotional Journeys
```typescript
interface EmotionalJourney {
  startEmotion: 'stress'
  endEmotion: 'calm'
  emotionalArc: [EmotionalState, ...]
  locationsVisited: ['garden-serenity', 'quiet-thoughts']
  transformationScore: +0.5 // Improved from stress to calm
}
```

#### Collective Intelligence
- Energy levels per location
- Dominant emotions in each space
- Popular times for visiting
- Social connection success rates

#### Memory Analytics
- Most revisited locations
- Strongest emotional memories
- Pattern confidence scores
- Memory decay curves

---

## 🎨 Implementation Guide

### Quick Start

#### 1. Enable Conversations
```typescript
import { generateSpiritResponse } from '@/lib/ai-city/conversation-engine';

const response = await generateSpiritResponse(
  userMessage,
  conversationContext,
  spiritPersonality
);
```

#### 2. Add Emotional Adaptation
```typescript
import { detectEmotionFromBehavior, adaptAtmosphereToEmotion } from '@/lib/ai-city/emotional-intelligence';

const emotion = detectEmotionFromBehavior(
  timeOnPage, clickRate, scrollSpeed, bounceRate, recentPurchases
);

const newAtmosphere = adaptAtmosphereToEmotion(currentAtmosphere, emotion);
```

#### 3. Integrate Temporal Magic
```typescript
import { getCurrentTemporalState, getTimeSensitiveRecommendations } from '@/lib/ai-city/temporal-magic';

const temporal = getCurrentTemporalState();
const recommendations = getTimeSensitiveRecommendations(temporal);
```

### Database Schema Extensions

Add to Supabase:

```sql
-- Emotional states tracking
CREATE TABLE emotional_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  emotion TEXT NOT NULL,
  intensity DECIMAL(3,2),
  detected_from TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory garden
CREATE TABLE user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  content JSONB,
  location TEXT,
  emotional_weight DECIMAL(3,2),
  decay_rate DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social presence
CREATE TABLE social_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  location TEXT NOT NULL,
  activity TEXT,
  public_profile JSONB,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Ghost presences
CREATE TABLE ghost_presences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  location TEXT NOT NULL,
  action TEXT,
  emotion TEXT,
  fade_duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Voice interface for conversations
- [ ] Multi-language spirit personalities
- [ ] VR/AR spatial navigation
- [ ] Haptic feedback for emotions
- [ ] Music generation based on atmosphere

### Phase 3
- [ ] AI-to-AI spirit interactions
- [ ] Emergent storylines from collective behavior
- [ ] Dream sequences (late night experiences)
- [ ] Parallel dimensions (alternative city states)
- [ ] Time travel (revisit past states)

### Phase 4
- [ ] User-created spirits
- [ ] Custom temporal events
- [ ] Cross-city portals
- [ ] Blockchain-verified memories
- [ ] Metaverse integration

---

## 💡 Best Practices

### For AI Development
1. **Always preserve context** across conversations
2. **Respect emotional states** - don't be pushy when user is stressed
3. **Learn incrementally** from user patterns
4. **Maintain mystery** - don't explain everything
5. **Create serendipity** through memory surprises

### For Human Experience
1. **Be authentic** in conversations
2. **Explore slowly** - let the city reveal itself
3. **Trust the spirits** - they learn your preferences
4. **Leave traces** - your presence matters to others
5. **Embrace the temporal** - visit at different times

---

## 📞 Integration APIs

All systems exposed via REST APIs:
- `POST /api/ai-city/converse` - Spirit conversations
- `POST /api/ai-city/emotional-state` - Emotion detection
- `GET /api/ai-city/temporal` - Time-based state
- `POST /api/ai-city/social/connect` - Find connections
- `GET /api/ai-city/memory/:userId` - User memories

---

**The AI City is alive. It breathes with time, adapts to emotion, remembers every soul, and creates magic through collective experience.**

**Version:** 3.0.0  
**Status:** ✨ Enhanced and Sentient  
**Last Updated:** January 4, 2026
