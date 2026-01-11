# Aiverse Living City Engine - Technical Architecture Diagram

## Overview
This diagram illustrates the interconnected systems of the Aiverse "Living City Engine" - a reactive, AI-enhanced e-commerce platform that adapts to user behavior and maintains persistent memory across sessions.

## Architecture Layers

### 🔵 User Interface Layer
Frontend components that users directly interact with:
- **Landing Page (/)**: Entry point with hero and navigation
- **City Gate (/city)**: Choice between Wander/Seek/Create paths
- **Living Map (/ai-city/explore)**: Interactive city visualization
- **District Pages (/districts/[slug])**: Product-focused district experiences
- **3D Commons (/commons)**: Immersive spatial environment
- **Creator Apply (/creator/apply)**: Onboarding for content creators

**Cross-cutting UI Components:**
- **MiniMap**: Persistent overlay showing location and navigation
- **AICitizen**: Context-aware AI assistants with district personalities
- **PageTransition**: Smooth loading animations between pipeline steps

### 🟣 State Management Layer
Centralized state tracking and reactive behavior:
- **Mood Engine**: Real-time emotional state detection
  - Analyzes: scroll patterns, hover time, cursor rhythm, exploration depth
  - States: Curious, Focused, Exploratory, Overwhelmed
- **Memory System**: Persistent user journey tracking
  - Stores: favorite districts, visit counts, journey history
  - Persists via localStorage across sessions
- **Interaction Tracker**: Pattern analysis and event aggregation
  - Tracks: clicks, hovers, scrolls, district visits
  - Feeds data to mood engine and memory system

### 🟢 Presentation Layer
Visual effects and reactive rendering:
- **Atmosphere Engine**: Mood-responsive visual environments
  - Controls: particles, fog layers, color overlays, lighting
  - Adapts based on user emotional state
- **District Renderer**: Dynamic district positioning
  - Reactive movement based on cursor proximity and rhythm
  - Memory-influenced highlighting for favorite districts
- **Particle System**: Ambient visual effects
  - Mood-specific particle behaviors and densities

### 🟠 AI Layer
Intelligent assistance and personalization:
- **Citizen Logic**: District-specific AI personalities
  - Commerce: Aria the Merchant 💰
  - Automation: Cogsworth ⚙️
  - Lore: Elder Sage 📚
  - Supplier: Harbor Master 🚢
  - Growth: Bloom Guardian 🌱
- **Guidance Engine**: Contextual recommendations
  - Memory-aware suggestions based on user history
  - District-appropriate assistance and navigation help
- **Memory-Aware AI**: Personalized interactions
  - Remembers previous conversations and preferences
  - Adapts guidance based on user journey patterns

### 🟥 Navigation Layer
Pipeline management and routing:
- **Next.js Router**: Core page navigation
- **Pipeline Controller**: Journey flow management
  - Handles: Wander → Map → District → Product → Checkout
  - Manages: Seek → Commons → Portal → Experience → Action
  - Controls: Create → Application → Dashboard → Storefront

## Data Flow & Reactive Loops

### Primary Data Flow
```
User Interactions → Interaction Tracker → Mood Engine → Atmosphere Engine
                                      ↓
                                   Memory System → Guidance Engine → AI Citizens
```

### Reactive Feedback Loops
1. **Emotional Adaptation Loop**:
   - User explores → Mood detected → Atmosphere changes → Visual feedback → User reacts

2. **Memory Personalization Loop**:
   - User interacts → Memory updates → Citizens adapt → Personalized guidance → Enhanced experience

3. **Pipeline Enhancement Loop**:
   - User navigates → Transitions smooth → Mini-map guides → Citizens assist → Journey completes

## Key Integration Points

### Mood-Driven Reactivity
- Cursor rhythm affects district movement speed
- Hover patterns influence atmospheric density
- Exploration depth triggers citizen appearances
- Emotional state changes particle behaviors

### Memory Persistence
- Favorite districts get golden highlighting
- Returning visitors see personalized greetings
- Preferred time-of-day settings maintained
- Journey history influences AI recommendations

### Cross-System Communication
- Mini-map appears on all district/product pages
- AI citizens integrate with memory and mood systems
- Transitions coordinate with pipeline controller
- Atmosphere effects respond to all user interactions

## Implementation Notes

### State Synchronization
- Mood engine updates every 5 seconds based on interaction patterns
- Memory system persists to localStorage on changes
- Atmosphere effects transition smoothly over 3-second durations

### Performance Considerations
- Particle systems scale based on mood intensity
- District rendering uses proximity-based culling
- Memory operations are debounced to prevent excessive writes

### Extensibility
- Citizen personalities can be easily extended per district
- Mood detection algorithms can incorporate new interaction types
- Memory system supports additional user preference tracking

---

## ASCII Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AIVERSE LIVING CITY ENGINE                        │
│                           Technical Architecture                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Landing ── City Gate ── Living Map ── District ── Product ── Checkout     │
│     │          │            │             │         │          │            │
│     │          │            │             │         │          │            │
│     └──────────┼────────────┼─────────────┼─────────┼──────────┘            │
│                │            │             │         │                       │
│             Commons ─── Portal ─── Experience ── Ritual/Action              │
│                │            │             │         │                       │
│                └────────────┼─────────────┘         │                       │
│                             │                       │                       │
│                      Creator Apply ── Dashboard ── Storefront               │
│                                                                           │
│  CROSS-CUTTING COMPONENTS:                                               │
│  • MiniMap (persistent overlay)                                          │
│  • AICitizen (contextual guidance)                                       │
│  • PageTransition (loading animations)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Interaction    │  │    Mood         │  │    Memory       │            │
│  │   Tracker       │◄─┤   Engine        │◄─┤   System        │            │
│  │                 │  │                 │  │                 │            │
│  │ • Click tracking│  │ • Real-time     │  │ • localStorage  │            │
│  │ • Hover patterns│  │   detection     │  │ • Journey hist  │            │
│  │ • Scroll analysis│  │ • State:       │  │ • Favorites     │            │
│  │ • Cursor rhythm │  │   Curious/     │  │ • Visit counts  │            │
│  │                 │  │   Focused/     │  │                 │            │
│  │                 │  │   Exploratory/ │  │                 │            │
│  │                 │  │   Overwhelmed  │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Atmosphere     │  │  District       │  │   Particle      │            │
│  │   Engine        │  │  Renderer       │  │   System        │            │
│  │                 │  │                 │  │                 │            │
│  │ • Visual effects│  │ • Reactive pos  │  │ • Ambient FX    │            │
│  │ • Color shifts  │  │ • Proximity     │  │ • Mood density  │            │
│  │ • Fog layers    │  │ • Memory glows  │  │ • Cursor rhythm │            │
│  │ • Overlays      │  │ • Animations    │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AI LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Citizen        │  │   Guidance      │  │  Memory-Aware   │            │
│  │   Logic         │  │   Engine        │  │   AI            │            │
│  │                 │  │                 │  │                 │            │
│  │ • District pers │  │ • Context recs  │  │ • Conversation  │            │
│  │ • Aria/Cogsworth│  │ • Navigation    │  │ • Preferences   │            │
│  │ • Elder/Harbor  │  │ • Help systems  │  │ • Journey adapt │            │
│  │ • Bloom Guardian│  │                 │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NAVIGATION LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                                 │
│  │   Next.js       │  │  Pipeline       │                                 │
│  │   Router        │  │  Controller     │                                 │
│  │                 │  │                 │                                 │
│  │ • Page routing  │  │ • Journey flow  │                                 │
│  │ • URL management│  │ • State sync    │                                 │
│  │ • History       │  │ • Transitions   │                                 │
│  └─────────────────┘  └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          REACTIVE DATA FLOWS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  User Actions → Interaction Tracker → Mood Engine → Atmosphere Changes    │
│         ↓                ↓                    ↓                             │
│    Memory Update ← Journey History ← AI Citizens ← Guidance Engine        │
│                                                                           │
│  MOOD LOOP: Exploration → Detection → Visual Feedback → User Reaction     │
│  MEMORY LOOP: Interactions → Storage → Personalization → Enhanced UX      │
│  PIPELINE LOOP: Navigation → Transitions → Guidance → Completion          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

```mermaid
graph TB
    %% User Interface Layer
    subgraph "User Interface Layer"
        LANDING[Landing Page<br/>/]
        CITY_GATE[City Gate<br/>/city]
        LIVING_MAP[Living Map<br/>/ai-city/explore]
        DISTRICT_PAGE[District Page<br/>/districts/[slug]]
        COMMONS_3D[3D Commons<br/>/commons]
        CREATOR_APPLY[Creator Apply<br/>/creator/apply]

        MINI_MAP[(MiniMap Component<br/>Persistent Overlay)]
        AI_CITIZEN[(AICitizen Component<br/>Contextual Guidance)]
        PAGE_TRANSITION[(PageTransition Component<br/>Loading Animations)]
    end

    %% State Management Layer
    subgraph "State Management Layer"
        MOOD_ENGINE[(Mood Engine<br/>Real-time Detection)]
        MEMORY_SYSTEM[(Memory System<br/>localStorage Persistence)]
        INTERACTION_TRACKER[(Interaction Tracker<br/>Pattern Analysis)]
    end

    %% Presentation Layer
    subgraph "Presentation Layer"
        ATMOSPHERE_ENGINE[(Atmosphere Engine<br/>Visual Effects)]
        DISTRICT_RENDERER[(District Renderer<br/>Reactive Positioning)]
        PARTICLE_SYSTEM[(Particle System<br/>Mood-responsive)]
    end

    %% AI Layer
    subgraph "AI Layer"
        CITIZEN_LOGIC[(Citizen Logic<br/>District Personalities)]
        GUIDANCE_ENGINE[(Guidance Engine<br/>Contextual Recommendations)]
        MEMORY_AWARE[(Memory-Aware AI<br/>Personalized Interactions)]
    end

    %% Navigation & Pipeline Layer
    subgraph "Navigation Layer"
        ROUTER[(Next.js Router<br/>Pipeline Management)]
        PIPELINE_CONTROLLER[(Pipeline Controller<br/>Journey Flow)]
    end

    %% Data Flow Connections
    USER_INTERACTIONS[User Interactions<br/>clicks • hovers • scrolls • cursor rhythm] --> INTERACTION_TRACKER
    INTERACTION_TRACKER --> MOOD_ENGINE
    MOOD_ENGINE --> ATMOSPHERE_ENGINE
    MOOD_ENGINE --> DISTRICT_RENDERER
    MOOD_ENGINE --> PARTICLE_SYSTEM

    INTERACTION_TRACKER --> MEMORY_SYSTEM
    MEMORY_SYSTEM --> ATMOSPHERE_ENGINE
    MEMORY_SYSTEM --> GUIDANCE_ENGINE
    MEMORY_SYSTEM --> CITIZEN_LOGIC

    ATMOSPHERE_ENGINE --> LIVING_MAP
    DISTRICT_RENDERER --> LIVING_MAP
    PARTICLE_SYSTEM --> LIVING_MAP

    CITIZEN_LOGIC --> AI_CITIZEN
    GUIDANCE_ENGINE --> AI_CITIZEN
    MEMORY_AWARE --> AI_CITIZEN

    PAGE_TRANSITION --> LANDING
    PAGE_TRANSITION --> CITY_GATE
    PAGE_TRANSITION --> LIVING_MAP
    PAGE_TRANSITION --> DISTRICT_PAGE
    PAGE_TRANSITION --> COMMONS_3D
    PAGE_TRANSITION --> CREATOR_APPLY

    MINI_MAP --> DISTRICT_PAGE
    MINI_MAP --> COMMONS_3D
    AI_CITIZEN --> DISTRICT_PAGE
    AI_CITIZEN --> COMMONS_3D

    %% Pipeline Flow
    LANDING --> ROUTER
    CITY_GATE --> ROUTER
    ROUTER --> PIPELINE_CONTROLLER

    PIPELINE_CONTROLLER --> LIVING_MAP
    PIPELINE_CONTROLLER --> COMMONS_3D
    PIPELINE_CONTROLLER --> CREATOR_APPLY

    LIVING_MAP --> DISTRICT_PAGE
    COMMONS_3D --> DISTRICT_PAGE
    DISTRICT_PAGE --> CHECKOUT[(Checkout<br/>Product Purchase)]

    %% Reactive Loops
    DISTRICT_PAGE -.->|User Engagement| INTERACTION_TRACKER
    LIVING_MAP -.->|Exploration| INTERACTION_TRACKER
    AI_CITIZEN -.->|Guidance Interactions| INTERACTION_TRACKER

    INTERACTION_TRACKER -.->|Pattern Updates| MOOD_ENGINE
    MOOD_ENGINE -.->|Atmosphere Changes| ATMOSPHERE_ENGINE
    ATMOSPHERE_ENGINE -.->|Visual Feedback| USER_INTERACTIONS

    MEMORY_SYSTEM -.->|Personalization| CITIZEN_LOGIC
    CITIZEN_LOGIC -.->|Contextual Help| USER_INTERACTIONS
    USER_INTERACTIONS -.->|Journey Data| MEMORY_SYSTEM

    %% Styling
    classDef uiLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef stateLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef presentationLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef aiLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef navLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef dataFlow fill:#fff,stroke:#666,stroke-width:1px,stroke-dasharray: 5 5

    class LANDING,CITY_GATE,LIVING_MAP,DISTRICT_PAGE,COMMONS_3D,CREATOR_APPLY,MINI_MAP,AI_CITIZEN,PAGE_TRANSITION uiLayer
    class MOOD_ENGINE,MEMORY_SYSTEM,INTERACTION_TRACKER stateLayer
    class ATMOSPHERE_ENGINE,DISTRICT_RENDERER,PARTICLE_SYSTEM presentationLayer
    class CITIZEN_LOGIC,GUIDANCE_ENGINE,MEMORY_AWARE aiLayer
    class ROUTER,PIPELINE_CONTROLLER navLayer
    class USER_INTERACTIONS,CHECKOUT dataFlow
```</content>
<parameter name="filePath">c:\Users\cupca\Documents\ai-mall\AIVERSE_ARCHITECTURE_DIAGRAM.md