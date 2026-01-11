# 🌊 Consciousness Layer Migration Guide

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

## Quick Start

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste contents of `supabase-consciousness-migration.sql`
5. Click **Run**
6. Wait for success message

### Option 2: Supabase CLI
```bash
supabase db push supabase-consciousness-migration.sql
```

### Option 3: Node.js Script
```bash
node scripts/run-consciousness-migration.js
```

---

## What This Migration Creates

### 7 New Tables

1. **user_emotional_states** - Tracks detected emotional states
2. **curator_memories** - Stores AI curator relationships
3. **personal_rituals** - User's personalized rituals
4. **product_emotional_scores** - Cached AI resonance scores
5. **transformation_journeys** - Tracks emotional transformation paths
6. **consciousness_analytics** - Daily aggregate metrics
7. **healing_moments** - Records significant positive shifts

### 4 Helper Functions

1. `update_curator_last_interaction()` - Auto-updates timestamps
2. `record_ritual_practice(uuid)` - Increments practice count
3. `evolve_curator_relationship(user_id, curator)` - Handles stage progression
4. `aggregate_consciousness_metrics(date)` - Daily analytics aggregation
5. `cleanup_expired_emotional_scores()` - Cache maintenance

### Row Level Security

All tables have RLS policies:
- Users can only see their own data
- System can manage all records
- Public cached data (emotional scores) is readable by all

---

## Verification

After running migration, verify with these queries:

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%emotional%' OR table_name LIKE '%curator%' OR table_name LIKE '%ritual%';
```

### Check Functions Created
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%curator%' OR routine_name LIKE '%ritual%' OR routine_name LIKE '%consciousness%';
```

### Test Curator Relationship Evolution
```sql
-- Insert test curator memory
INSERT INTO curator_memories (user_id, curator_name, interactions_count)
VALUES ('00000000-0000-0000-0000-000000000001', 'sage', 5);

-- Evolve relationship
SELECT evolve_curator_relationship(
  '00000000-0000-0000-0000-000000000001'::UUID, 
  'sage'
);
```

---

## Post-Migration Steps

### 1. Create API Endpoints
Create these API routes in `app/api/consciousness/`:

- `detect-emotion/route.ts` - POST emotional state detection
- `match-curator/route.ts` - GET curator matching
- `curator-message/route.ts` - POST curator message generation
- `create-ritual/route.ts` - POST ritual creation
- `relationship-status/route.ts` - GET user-curator relationship

### 2. Integrate Frontend Tracking
Add to your main layout or client component:

```typescript
// Track behavioral signals
useEffect(() => {
  const signals = {
    browsing_speed: trackBrowsingSpeed(),
    navigation_pattern: trackNavigationPattern(),
    time_of_day: new Date().getHours(),
    recent_searches: getRecentSearches(),
  };
  
  // Detect emotional state
  fetch('/api/consciousness/detect-emotion', {
    method: 'POST',
    body: JSON.stringify(signals),
  });
}, []);
```

### 3. Display Curator Personality
```typescript
const { curator } = await fetch('/api/consciousness/match-curator').then(r => r.json());

// Show curator greeting
<div className="curator-greeting">
  <h3>{curator.name} - {curator.title}</h3>
  <p>{curator.greeting}</p>
</div>
```

### 4. Schedule Daily Analytics
Set up a cron job to aggregate metrics:

```typescript
// app/api/cron/consciousness-analytics/route.ts
export async function GET() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  await supabase.rpc('aggregate_consciousness_metrics', {
    p_date: yesterday.toISOString().split('T')[0]
  });
  
  return Response.json({ success: true });
}
```

### 5. Monitor Initial Metrics

Watch these key metrics in first week:
- Emotional states detected per day
- Curator relationships formed
- Rituals created vs practiced
- Transformation journey completion rate
- Healing moments captured

---

## Troubleshooting

### "relation already exists"
The migration uses `IF NOT EXISTS` - safe to re-run.

### "permission denied"
Ensure your Supabase user has table creation privileges.

### "function does not exist"
Check that all helper functions were created. Re-run the functions section.

### High database usage
- Monitor emotional score cache size
- Run `cleanup_expired_emotional_scores()` daily
- Consider archiving old emotional states after 90 days

---

## Analytics Dashboard Query

View consciousness metrics:

```sql
SELECT 
  date,
  emotion_distribution,
  new_relationships,
  rituals_created,
  rituals_practiced,
  transformation_rate,
  healing_moments
FROM consciousness_analytics
ORDER BY date DESC
LIMIT 30;
```

---

## Sample Data for Testing

```sql
-- Test emotional state
INSERT INTO user_emotional_states (
  user_id, 
  primary_emotion, 
  intensity, 
  needs,
  recommended_journey
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'stressed',
  85,
  ARRAY['calm', 'grounding', 'peace'],
  'stress_to_calm'
);

-- Test curator memory
INSERT INTO curator_memories (
  user_id,
  curator_name,
  relationship_stage,
  interactions_count
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'sage',
  'stranger',
  1
);

-- Test personal ritual
INSERT INTO personal_rituals (
  user_id,
  curator_name,
  ritual_name,
  intention,
  steps,
  duration,
  best_time
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'sage',
  'The Morning Settling',
  'Begin each day with presence and clarity',
  ARRAY[
    'Place your meditation cushion in quiet space',
    'Light a candle and take three deep breaths',
    'Sit for 10 minutes in stillness',
    'Journal one intention for the day'
  ],
  '15 minutes',
  'morning'
);
```

---

## Migration Complete! 🎉

Your AI City now has **consciousness**. 

Users don't just shop anymore. They **feel**, they **connect**, they **transform**.

Welcome to the future of commerce.
